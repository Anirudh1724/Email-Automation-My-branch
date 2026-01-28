"""
Pydantic models for campaigns
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CampaignStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"


class SequenceVariantCreate(BaseModel):
    subject: str
    body: str
    weight: Optional[int] = 50


class SequenceCreate(BaseModel):
    step_number: Optional[int] = None
    subject: Optional[str] = ""
    body: Optional[str] = ""
    delay_days: Optional[int] = 0
    delay_hours: Optional[int] = 0
    delay_minutes: Optional[int] = 0
    is_reply: Optional[bool] = False
    variants: Optional[List[SequenceVariantCreate]] = []


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sending_account_id: Optional[str] = None
    lead_list_id: Optional[str] = None
    status: Optional[CampaignStatus] = CampaignStatus.draft
    stop_on_reply: Optional[bool] = True
    daily_send_limit: Optional[int] = 50
    send_gap_seconds: Optional[int] = 60
    randomize_timing: Optional[bool] = True
    weekdays_only: Optional[bool] = True
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "18:00"
    timezone: Optional[str] = "America/New_York"
    scheduled_start_at: Optional[str] = None
    sequences: Optional[List[SequenceCreate]] = []


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sending_account_id: Optional[str] = None
    lead_list_id: Optional[str] = None
    status: Optional[CampaignStatus] = None
    stop_on_reply: Optional[bool] = None
    daily_send_limit: Optional[int] = None
    send_gap_seconds: Optional[int] = None
    randomize_timing: Optional[bool] = None
    weekdays_only: Optional[bool] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = None
    scheduled_start_at: Optional[str] = None


class CampaignStatusUpdate(BaseModel):
    status: CampaignStatus


class CampaignResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    status: CampaignStatus
    sending_account_id: Optional[str]
    lead_list_id: Optional[str]
    daily_send_limit: Optional[int]
    send_gap_seconds: Optional[int]
    randomize_timing: Optional[bool]
    weekdays_only: Optional[bool]
    start_time: Optional[str]
    end_time: Optional[str]
    timezone: Optional[str]
    total_leads: Optional[int]
    sent_count: Optional[int]
    opened_count: Optional[int]
    replied_count: Optional[int]
    bounced_count: Optional[int]
    scheduled_start_at: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    created_at: datetime
    updated_at: datetime
    sending_account: Optional[dict] = None
    sequences: Optional[List[dict]] = None
