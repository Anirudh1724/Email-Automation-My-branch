"""
Pydantic models for leads and lead lists
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class LeadStatus(str, Enum):
    active = "active"
    sent = "sent"
    opened = "opened"
    replied = "replied"
    bounced = "bounced"
    unsubscribed = "unsubscribed"
    completed = "completed"


class LeadCreate(BaseModel):
    lead_list_id: str
    campaign_id: Optional[str] = None
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = {}
    status: Optional[LeadStatus] = LeadStatus.active


class LeadBulkCreate(BaseModel):
    lead_list_id: str
    campaign_id: Optional[str] = None
    leads: List[dict]  # [{email, first_name, last_name, company, custom_fields}]


class LeadUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    status: Optional[LeadStatus] = None


class LeadBulkDelete(BaseModel):
    ids: List[str]


class LeadResponse(BaseModel):
    id: str
    user_id: str
    campaign_id: Optional[str]
    lead_list_id: Optional[str]
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    company: Optional[str]
    custom_fields: Optional[Dict[str, Any]]
    status: LeadStatus
    current_step: Optional[int]
    first_sent_at: Optional[datetime]
    last_sent_at: Optional[datetime]
    opened_at: Optional[datetime]
    replied_at: Optional[datetime]
    bounced_at: Optional[datetime]
    unsubscribed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    campaign: Optional[dict] = None


# Lead Lists
class LeadListCreate(BaseModel):
    name: str
    description: Optional[str] = None


class LeadListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class LeadListResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    lead_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
