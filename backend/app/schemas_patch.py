from pydantic import BaseModel
from typing import Optional

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str
    recipient_role: str = "All"
