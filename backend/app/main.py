import os
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from .database import engine, Base, get_db
from .models import User, Zone, Incident, VolunteerAssignment, LostPerson, Announcement, Notification
from .schemas import (
    UserCreate, UserResponse, UserLogin,
    ZoneResponse, ZoneUpdate,
    IncidentCreate, IncidentResponse, IncidentUpdate,
    VolunteerAssignmentCreate, VolunteerAssignmentResponse,
    LostPersonCreate, LostPersonResponse,
    AnnouncementCreate, AnnouncementResponse,
    NotificationCreate, NotificationResponse,
    AIChatQuery, AIChatResponse, AIReportResponse, TranslationQuery
)
from .mock_data import seed_db
from . import ai_engine
from .auth import hash_password, verify_password

# Initialize database schemas
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed database on startup
    db = next(get_db())
    try:
        seed_db(db)
    finally:
        db.close()
    yield

app = FastAPI(title="AIrena Tournament Operations Backend", version="1.0.0", lifespan=lifespan)

# Enable CORS for Next.js frontend with restricted origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inject security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# WebSocket Manager for Real-Time Telemetry
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                # Remove inactive connection
                pass

manager = ConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial success greeting
        await websocket.send_json({"type": "INIT", "message": "Connected to AIrena Live Telemetry Feed"})
        while True:
            data = await websocket.receive_text()
            # If the client sends any ping, respond with a telemetry heartbeat
            await websocket.send_json({"type": "HEARTBEAT", "timestamp": str(datetime.datetime.now(datetime.timezone.utc))})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ----------------- AUTH ENDPOINTS -----------------

@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(
        username=user.username,
        hashed_password=hash_password(user.password),
        role=user.role,
        preferred_language=user.preferred_language
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=UserResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(db_user.hashed_password, user.password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    db_user.last_active = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    return db_user

# ----------------- ZONE & CROWD ENDPOINTS -----------------

@app.get("/api/zones", response_model=List[ZoneResponse])
def get_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()

@app.post("/api/zones/{zone_id}/simulate")
async def simulate_zone_crowd(zone_id: int, current_capacity: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    zone.current_capacity = current_capacity
    ratio = current_capacity / zone.safe_capacity
    
    if ratio >= 1.0:
        zone.risk_level = "High"
    elif ratio >= 0.8:
        zone.risk_level = "Medium"
    else:
        zone.risk_level = "Low"
        
    db.commit()
    db.refresh(zone)
    
    # Generate AI recommendation if congested
    ai_advice = ai_engine.ai_generate_crowd_recommendation(zone.name, zone.current_capacity, zone.safe_capacity)
    
    # Broadcast telemetry update to all connected dashboard websockets
    telemetry_data = {
        "type": "CROWD_UPDATE",
        "zone_id": zone.id,
        "zone_name": zone.name,
        "current_capacity": zone.current_capacity,
        "safe_capacity": zone.safe_capacity,
        "risk_level": zone.risk_level,
        "ai_alert": ai_advice.get("alert"),
        "ai_recommendation": ai_advice.get("recommendation"),
        "alternate_routes": ai_advice.get("alternate_routes"),
        "timestamp": str(datetime.datetime.now(datetime.timezone.utc))
    }
    
    # If high risk, create a push notification automatically
    if zone.risk_level == "High":
        notif = Notification(
            title=f"Crowd Alert: {zone.name}",
            message=ai_advice.get("recommendation"),
            type="Push",
            recipient_role="Organizer"
        )
        db.add(notif)
        db.commit()
        await manager.broadcast({"type": "NOTIFICATION", "title": notif.title, "message": notif.message})

    await manager.broadcast(telemetry_data)
    return telemetry_data

# ----------------- INCIDENT ENDPOINTS -----------------

@app.get("/api/incidents", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.timestamp.desc()).all()

@app.post("/api/incidents", response_model=IncidentResponse)
async def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    # Generate AI decision recommendations, nearest resources, and routes
    ai_data = ai_engine.ai_generate_incident_support(
        category=incident.category,
        description=incident.description,
        zone=incident.location_zone
    )
    
    new_incident = Incident(
        category=incident.category,
        description=incident.description,
        location_zone=incident.location_zone,
        severity=incident.severity,
        reporter_name=incident.reporter_name,
        status="Active",
        ai_summary=ai_data.get("ai_summary"),
        recommended_actions=ai_data.get("recommended_actions"),
        nearest_resources=ai_data.get("nearest_resources"),
        safe_routes=ai_data.get("safe_routes")
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    # Push emergency notification based on severity
    notif = Notification(
        title=f"Emergency Alert: {new_incident.category} in {new_incident.location_zone}",
        message=f"{new_incident.description} (AI: {new_incident.ai_summary})",
        type="Push",
        recipient_role="Security" if incident.category in ["Security", "Fire"] else "Medical"
    )
    db.add(notif)
    db.commit()
    
    # Broadcast incident update to map dashboard
    await manager.broadcast({
        "type": "NEW_INCIDENT",
        "incident": {
            "id": new_incident.id,
            "category": new_incident.category,
            "description": new_incident.description,
            "location_zone": new_incident.location_zone,
            "severity": new_incident.severity,
            "status": new_incident.status,
            "ai_summary": new_incident.ai_summary,
            "recommended_actions": new_incident.recommended_actions,
            "nearest_resources": new_incident.nearest_resources,
            "safe_routes": new_incident.safe_routes,
            "timestamp": str(new_incident.timestamp)
        }
    })
    
    return new_incident

@app.patch("/api/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: int, updates: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if updates.status is not None:
        incident.status = updates.status
    if updates.assigned_responder is not None:
        incident.assigned_responder = updates.assigned_responder
    if updates.ai_summary is not None:
        incident.ai_summary = updates.ai_summary
    if updates.recommended_actions is not None:
        incident.recommended_actions = updates.recommended_actions
        
    db.commit()
    db.refresh(incident)
    
    await manager.broadcast({
        "type": "UPDATE_INCIDENT",
        "incident_id": incident.id,
        "status": incident.status,
        "assigned_responder": incident.assigned_responder
    })
    return incident

@app.get("/api/incidents/{incident_id}/report", response_model=AIReportResponse)
def get_incident_report(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc_dict = {
        "id": incident.id,
        "category": incident.category,
        "description": incident.description,
        "location_zone": incident.location_zone,
        "severity": incident.severity,
        "status": incident.status,
        "reporter_name": incident.reporter_name,
        "timestamp": str(incident.timestamp)
    }
    report = ai_engine.ai_generate_incident_report(inc_dict)
    return report

# ----------------- COPAILOT & CHAT ENDPOINTS -----------------

@app.post("/api/volunteers/chat", response_model=AIChatResponse)
def volunteer_chat(query: AIChatQuery):
    return ai_engine.ai_chat_assistant(query)

# ----------------- ANNOUNCEMENT & MULTILINGUAL ENDPOINTS -----------------

@app.get("/api/announcements", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.timestamp.desc()).all()

@app.post("/api/announcements", response_model=AnnouncementResponse)
async def create_announcement(ann: AnnouncementCreate, db: Session = Depends(get_db)):
    # Generate multi-language translations for English, Hindi, Tamil, Telugu, Kannada, Malayalam, French, Japanese
    target_langs = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "French", "Japanese"]
    translations = ai_engine.ai_translate_announcement(ann.message, target_langs)
    
    new_ann = Announcement(
        message=ann.message,
        category=ann.category,
        target_role=ann.target_role,
        original_lang=ann.original_lang,
        translations_json=translations
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    
    await manager.broadcast({
        "type": "NEW_ANNOUNCEMENT",
        "announcement": {
            "id": new_ann.id,
            "message": new_ann.message,
            "category": new_ann.category,
            "target_role": new_ann.target_role,
            "translations": new_ann.translations_json,
            "timestamp": str(new_ann.timestamp)
        }
    })
    
    return new_ann

# ----------------- LOST PERSON ENDPOINTS -----------------

@app.get("/api/lost-persons", response_model=List[LostPersonResponse])
def get_lost_persons(db: Session = Depends(get_db)):
    return db.query(LostPerson).order_by(LostPerson.reported_at.desc()).all()

@app.post("/api/lost-persons", response_model=LostPersonResponse)
async def report_lost_person(person: LostPersonCreate, db: Session = Depends(get_db)):
    # AI models generate initial search guidelines and sighting timelines
    ai_search = ai_engine.ai_lost_person_match(
        lost_desc=person.description,
        clothing=person.clothing,
        age=person.age,
        last_seen=person.last_seen_location
    )
    
    new_person = LostPerson(
        name=person.name,
        age=person.age,
        description=person.description,
        clothing=person.clothing,
        last_seen_location=person.last_seen_location,
        last_seen_time=person.last_seen_time,
        status="Missing",
        timeline_json=ai_search.get("timeline"),
        search_recommendations=ai_search.get("search_recommendations")
    )
    db.add(new_person)
    db.commit()
    db.refresh(new_person)
    
    # Broadcast update
    await manager.broadcast({
        "type": "NEW_LOST_PERSON",
        "person": {
            "id": new_person.id,
            "name": new_person.name,
            "age": new_person.age,
            "description": new_person.description,
            "clothing": new_person.clothing,
            "last_seen_location": new_person.last_seen_location,
            "status": new_person.status,
            "search_recommendations": new_person.search_recommendations,
            "timeline": new_person.timeline_json
        }
    })
    
    return new_person

# ----------------- NOTIFICATION CENTER -----------------

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.timestamp.desc()).limit(30).all()

@app.post("/api/notifications", response_model=NotificationResponse)
def create_notification(notif: NotificationCreate, db: Session = Depends(get_db)):
    db_notif = Notification(
        title=notif.title,
        message=notif.message,
        type=notif.type,
        recipient_role=notif.recipient_role
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif
