from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    role: str
    preferred_language: str = "English"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    last_active: datetime

    class Config:
        from_attributes = True

# Zone Schemas
class ZoneBase(BaseModel):
    name: str
    safe_capacity: int
    current_capacity: int = 0
    risk_level: str = "Low"
    coordinate_x: float
    coordinate_y: float

class ZoneResponse(ZoneBase):
    id: int

    class Config:
        from_attributes = True

class ZoneUpdate(BaseModel):
    current_capacity: Optional[int] = None
    risk_level: Optional[str] = None

# Incident Schemas
class IncidentBase(BaseModel):
    category: str
    description: str
    location_zone: str
    severity: str = "Medium"
    reporter_name: str

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id: int
    status: str
    timestamp: datetime
    assigned_responder: Optional[str] = None
    ai_summary: Optional[str] = None
    recommended_actions: Optional[str] = None
    nearest_resources: Optional[List[Dict[str, Any]]] = None
    safe_routes: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_responder: Optional[str] = None
    ai_summary: Optional[str] = None
    recommended_actions: Optional[str] = None

# Volunteer Assignment Schemas
class VolunteerAssignmentBase(BaseModel):
    volunteer_id: int
    zone_id: int
    description: str

class VolunteerAssignmentCreate(VolunteerAssignmentBase):
    pass

class VolunteerAssignmentResponse(VolunteerAssignmentBase):
    id: int
    status: str
    assigned_at: datetime

    class Config:
        from_attributes = True

# Lost Person Schemas
class SightingCreate(BaseModel):
    location: str
    time: str
    notes: str

class LostPersonBase(BaseModel):
    name: str
    age: int
    description: str
    clothing: str
    last_seen_location: str
    last_seen_time: str

class LostPersonCreate(LostPersonBase):
    pass

class LostPersonResponse(LostPersonBase):
    id: int
    status: str
    reported_at: datetime
    timeline_json: Optional[List[Dict[str, Any]]] = None
    search_recommendations: Optional[str] = None

    class Config:
        from_attributes = True

# Announcement Schemas
class AnnouncementBase(BaseModel):
    message: str
    category: str = "Info"
    target_role: str = "All"
    original_lang: str = "English"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    translations_json: Optional[Dict[str, str]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    recipient_role: str = "All"

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    timestamp: datetime

    class Config:
        from_attributes = True

# AI Chat and Support Schemas
class AIChatQuery(BaseModel):
    message: str
    role: str = "Fan"  # Fan, Volunteer, Organizer, Security, Medical, Admin
    zone: Optional[str] = None
    preferred_language: str = "English"

class AIChatResponse(BaseModel):
    response: str
    suggested_actions: List[str] = []
    language: str = "English"

class AIReportQuery(BaseModel):
    incident_id: int

class AIReportResponse(BaseModel):
    incident_id: int
    title: str
    summary: str
    key_findings: List[str]
    timeline: List[str]
    corrective_actions: List[str]
    status: str
    generated_at: str

class TranslationQuery(BaseModel):
    text: str
    source_lang: str = "English"
    target_langs: List[str] = []
