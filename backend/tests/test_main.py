import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import User, Zone, Incident
from app.auth import hash_password

# Create in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database dependency in FastAPI app
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup database schemas before each test
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed minimal test data
    admin = User(username="test_admin", hashed_password=hash_password("password"), role="Admin")
    zone = Zone(name="Test Gate A", safe_capacity=1000, current_capacity=100, coordinate_x=10, coordinate_y=10)
    db.add(admin)
    db.add(zone)
    db.commit()
    yield
    # Drop schemas after test finishes
    Base.metadata.drop_all(bind=engine)

def test_user_registration():
    response = client.post("/api/auth/register", json={
        "username": "test_user_new",
        "password": "password123",
        "role": "Volunteer",
        "preferred_language": "Hindi"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "test_user_new"
    assert data["role"] == "Volunteer"

def test_user_login():
    # Register first
    client.post("/api/auth/register", json={
        "username": "auth_tester",
        "password": "secure_password",
        "role": "Organizer"
    })
    
    # Login
    response = client.post("/api/auth/login", json={
        "username": "auth_tester",
        "password": "secure_password"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "Organizer"

def test_get_zones():
    response = client.get("/api/zones")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Gate A"

def test_simulate_crowd():
    response = client.post("/api/zones/1/simulate?current_capacity=950")
    assert response.status_code == 200
    data = response.json()
    assert data["current_capacity"] == 950
    assert data["risk_level"] == "Medium"
    assert "ai_recommendation" in data

def test_create_and_fetch_incident():
    response = client.post("/api/incidents", json={
        "category": "Medical",
        "description": "Spectator feeling dizzy near concession stand.",
        "location_zone": "Test Gate A",
        "severity": "Medium",
        "reporter_name": "Volunteer-1"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Active"
    assert "ai_summary" in data
    
    # Verify listed in GET
    list_res = client.get("/api/incidents")
    assert len(list_res.json()) >= 1

def test_generate_incident_report():
    # Setup test incident
    db = TestingSessionLocal()
    inc = Incident(id=99, category="Fire", description="Minor bin fire", location_zone="Test Gate A", status="Active", severity="Low", reporter_name="Patrol")
    db.add(inc)
    db.commit()
    
    response = client.get("/api/incidents/99/report")
    assert response.status_code == 200
    data = response.json()
    assert data["incident_id"] == 99
    assert "key_findings" in data

def test_volunteer_ai_copilot_chat():
    response = client.post("/api/volunteers/chat", json={
        "message": "Where is my assignment?",
        "role": "Volunteer",
        "preferred_language": "English"
    })
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "suggested_actions" in data

def test_translate_announcements():
    response = client.post("/api/announcements", json={
        "message": "Gate A queue is full.",
        "category": "Alert",
        "target_role": "Fan"
    })
    assert response.status_code == 200
    data = response.json()
    assert "translations_json" in data
    assert "Hindi" in data["translations_json"]

def test_update_incident():
    # Create incident first
    response = client.post("/api/incidents", json={
        "category": "Medical",
        "description": "Spectator collapsed.",
        "location_zone": "Test Gate A",
        "severity": "High",
        "reporter_name": "Volunteer-1"
    })
    inc_id = response.json()["id"]
    
    # Update incident
    patch_res = client.patch(f"/api/incidents/{inc_id}", json={
        "status": "In Progress",
        "assigned_responder": "Med-B"
    })
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["status"] == "In Progress"
    assert data["assigned_responder"] == "Med-B"

def test_get_announcements():
    # Fetch announcements list
    response = client.get("/api/announcements")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_lost_persons():
    # Create lost person report
    post_res = client.post("/api/lost-persons", json={
        "name": "Alex",
        "age": 10,
        "description": "Blue cap, tall",
        "clothing": "Blue cap, white t-shirt",
        "last_seen_location": "Test Gate A",
        "last_seen_time": "12:00 PM"
    })
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["name"] == "Alex"
    assert data["status"] == "Missing"
    
    # Fetch lost persons
    get_res = client.get("/api/lost-persons")
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1

def test_notifications():
    # Create notification
    post_res = client.post("/api/notifications", json={
        "title": "Alert Test",
        "message": "This is a test notification",
        "type": "Push",
        "recipient_role": "Organizer"
    })
    assert post_res.status_code == 200
    data = post_res.json()
    assert data["title"] == "Alert Test"
    
    # Fetch notifications
    get_res = client.get("/api/notifications")
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1

def test_websocket():
    with client.websocket_connect("/ws/telemetry") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "INIT"
        websocket.send_text("ping")
        data = websocket.receive_json()
        assert data["type"] == "HEARTBEAT"
