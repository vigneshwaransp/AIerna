from sqlalchemy.orm import Session
from .models import User, Zone, Incident, VolunteerAssignment, Announcement, Notification
from .auth import hash_password
import datetime

def seed_db(db: Session):
    # Check if database is already seeded
    if db.query(User).first() is not None:
        return
        
    print("Seeding database...")
    
    # 1. Seed Users (with password 'password' hashed)
    users = [
        User(username="admin", hashed_password=hash_password("password"), role="Admin", preferred_language="English"),
        User(username="organizer", hashed_password=hash_password("password"), role="Organizer", preferred_language="English"),
        User(username="volunteer1", hashed_password=hash_password("password"), role="Volunteer", preferred_language="English"),
        User(username="volunteer2", hashed_password=hash_password("password"), role="Volunteer", preferred_language="Hindi"),
        User(username="security1", hashed_password=hash_password("password"), role="Security", preferred_language="English"),
        User(username="medical1", hashed_password=hash_password("password"), role="Medical", preferred_language="French"),
        User(username="fan1", hashed_password=hash_password("password"), role="Fan", preferred_language="Japanese"),
    ]
    for u in users:
        db.add(u)
    db.commit()
    
    # 2. Seed Zones
    zones = [
        Zone(name="Gate A (North Entrance)", safe_capacity=2000, current_capacity=1850, risk_level="Medium", coordinate_x=20.0, coordinate_y=15.0),
        Zone(name="Gate B (East Entrance)", safe_capacity=1500, current_capacity=600, risk_level="Low", coordinate_x=85.0, coordinate_y=40.0),
        Zone(name="Gate C (South Entrance)", safe_capacity=2500, current_capacity=800, risk_level="Low", coordinate_x=50.0, coordinate_y=90.0),
        Zone(name="Gate D (West Entrance)", safe_capacity=1200, current_capacity=1180, risk_level="High", coordinate_x=15.0, coordinate_y=60.0),
        Zone(name="Main Concourse", safe_capacity=5000, current_capacity=3400, risk_level="Low", coordinate_x=50.0, coordinate_y=50.0),
        Zone(name="Food Court Area", safe_capacity=1000, current_capacity=950, risk_level="Medium", coordinate_x=65.0, coordinate_y=65.0),
        Zone(name="North Stands (Row A-K)", safe_capacity=3000, current_capacity=2900, risk_level="Medium", coordinate_x=50.0, coordinate_y=25.0),
        Zone(name="South Stands (Row A-K)", safe_capacity=3000, current_capacity=1200, risk_level="Low", coordinate_x=50.0, coordinate_y=75.0),
        Zone(name="Medical Bay (Gate E)", safe_capacity=200, current_capacity=20, risk_level="Low", coordinate_x=80.0, coordinate_y=80.0),
    ]
    for z in zones:
        db.add(z)
    db.commit()
    
    # 3. Seed Incidents
    incidents = [
        Incident(
            category="Medical",
            description="Spectator collapsed in Row F of North Stands, complaining of chest pain and breathing difficulties.",
            location_zone="North Stands (Row A-K)",
            status="In Progress",
            severity="High",
            timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=12),
            reporter_name="Volunteer-1 (John)",
            assigned_responder="Med-A",
            ai_summary="Cardiac warning alert in North Stands. Emergency access protocol engaged.",
            recommended_actions="1. Med-A dispatched to North Stands Row F.\n2. Keep seating rows clear.\n3. Prepare medical transport via lift to Gate E Ambulance Bay.",
            nearest_resources=[{"name": "Med-A", "type": "Medical Unit", "eta": "2 mins"}, {"name": "Security-4", "type": "Crowd Guide", "eta": "4 mins"}],
            safe_routes=[{"from": "North Stands", "to": "Gate E (Medical Bay)", "path": "Take lift down to level 0, follow Corridor 3 directly to Gate E."}]
        ),
        Incident(
            category="Lost Child",
            description="6-year-old child named Aarav, wearing a bright red t-shirt and blue jeans, separated from parents near the Food Court ticket counter.",
            location_zone="Food Court Area",
            status="Active",
            severity="Medium",
            timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=8),
            reporter_name="Parent (Ananya)",
            assigned_responder="Security-Team 3",
            ai_summary="Missing child Aarav (6yo, red t-shirt) reported in Food Court quadrant.",
            recommended_actions="1. Notify all gate security guards to block exits.\n2. Deploy volunteer patrol to scan the dining zone.\n3. CCTV sweep of Food Court exits.",
            nearest_resources=[{"name": "Sec-Team 3", "type": "Security Patrol", "eta": "1 min"}, {"name": "Volunteer-2", "type": "Zone Guard", "eta": "3 mins"}],
            safe_routes=[]
        ),
        Incident(
            category="Security",
            description="Unattended backpack found leaning against structural column B12 near Gate D.",
            location_zone="Gate D (West Entrance)",
            status="Active",
            severity="High",
            timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5),
            reporter_name="Security Guard (Robert)",
            assigned_responder="Security-Team 1",
            ai_summary="Unattended package at Gate D column B12. Perimeter safety cordon requested.",
            recommended_actions="1. Enforce a 50m safety cordon around column B12.\n2. Divert entry queues from Gate D to Gate C.\n3. Request bomb squad dispatch.",
            nearest_resources=[{"name": "Sec-Team 1", "type": "Security Patrol", "eta": "2 mins"}],
            safe_routes=[{"from": "Gate D", "to": "Gate C (South Entrance)", "path": "Divert visitors outward to parking lane D, route along perimeter fence to Gate C."}]
        )
    ]
    for inc in incidents:
        db.add(inc)
    db.commit()
    
    # 4. Seed Volunteer Assignments
    assignments = [
        VolunteerAssignment(volunteer_id=3, zone_id=1, description="Assist ticketing queues at Gate A, manage scanner lines.", status="Assigned"),
        VolunteerAssignment(volunteer_id=4, zone_id=6, description="Patrol the food court pathways, report any spills or bottlenecks.", status="Assigned")
    ]
    for assign in assignments:
        db.add(assign)
    db.commit()
    
    # 5. Seed Announcements
    announcements = [
        Announcement(
            message="Attention visitors: Gate A is currently experiencing high queue wait times. Please use Gate B or Gate C for faster entry.",
            category="Alert",
            target_role="Fan",
            original_lang="English",
            translations_json={
                "English": "Attention visitors: Gate A is currently experiencing high queue wait times. Please use Gate B or Gate C for faster entry.",
                "Hindi": "सभी आगंतुकों का ध्यान दें: गेट ए पर वर्तमान में कतार का समय अधिक है। कृपया त्वरित प्रवेश के लिए गेट बी या गेट सी का उपयोग करें।",
                "French": "Attention aux visiteurs: La porte A connaît actuellement de longs temps d'attente. Veuillez utiliser la porte B ou la porte C pour une entrée plus rapide.",
                "Japanese": "来場者の皆様にご案内いたします：ゲートAは現在、待ち時間が長くなっています。スムーズな入場のタメに、ゲートBまたはゲートCをご利用ください。"
            }
        ),
        Announcement(
            message="Staff update: Heat index in North Stand is rising. Rotate positions every 30 minutes and hydrate.",
            category="Info",
            target_role="Volunteer",
            original_lang="English",
            translations_json={
                "English": "Staff update: Heat index in North Stand is rising. Rotate positions every 30 minutes and hydrate."
            }
        )
    ]
    for ann in announcements:
        db.add(ann)
    db.commit()
    
    # 6. Seed Notifications
    notifications = [
        Notification(title="Queue Peak Alert", message="Gate D is exceeding 95% capacity. Diverting traffic.", type="Push", recipient_role="Organizer"),
        Notification(title="Emergency Dispatched", message="Medical Team Med-A has acknowledged incident 1 in Row F.", type="Push", recipient_role="Medical"),
    ]
    for n in notifications:
        db.add(n)
    db.commit()
    
    print("Database seeding completed.")
