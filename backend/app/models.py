import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Fan, Volunteer, Organizer, Security, Medical, Admin
    preferred_language = Column(String, default="English")  # English, Hindi, Tamil, Telugu, Kannada, Malayalam, French, Japanese
    last_active = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    safe_capacity = Column(Integer, nullable=False)
    current_capacity = Column(Integer, default=0)
    risk_level = Column(String, default="Low")  # Low, Medium, High
    coordinate_x = Column(Float, nullable=False)  # Map relative X coord
    coordinate_y = Column(Float, nullable=False)  # Map relative Y coord

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # Medical, Fire, Evacuation, Lost Child, Security, Info
    description = Column(Text, nullable=False)
    location_zone = Column(String, nullable=False)
    status = Column(String, default="Active")  # Active, In Progress, Resolved
    severity = Column(String, default="Medium")  # Low, Medium, High
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    reporter_name = Column(String, nullable=False)
    assigned_responder = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recommended_actions = Column(Text, nullable=True)
    nearest_resources = Column(JSON, nullable=True)  # List of dicts: resource name, type, eta
    safe_routes = Column(JSON, nullable=True)  # Safe indoor evacuation route info

class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default="Assigned")  # Assigned, Completed, Cancelled
    assigned_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    volunteer = relationship("User", foreign_keys=[volunteer_id])
    zone = relationship("Zone", foreign_keys=[zone_id])

class LostPerson(Base):
    __tablename__ = "lost_persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    clothing = Column(Text, nullable=False)
    last_seen_location = Column(String, nullable=False)
    last_seen_time = Column(String, nullable=False)
    status = Column(String, default="Missing")  # Missing, Found
    reported_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
    timeline_json = Column(JSON, nullable=True)  # Sighting events list
    search_recommendations = Column(Text, nullable=True)  # AI-generated recommendation

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    category = Column(String, default="Info")  # Info, Alert, Emergency
    target_role = Column(String, default="All")  # All, Fan, Volunteer, Security, Medical, Organizer
    original_lang = Column(String, default="English")
    translations_json = Column(JSON, nullable=True)  # Key-value dictionary of language: text
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # Push, SMS, Email, Public
    recipient_role = Column(String, default="All")
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), index=True)
