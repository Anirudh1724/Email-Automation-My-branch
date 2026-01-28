"""
Pydantic models for email templates, sending accounts, and other entities
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Email Templates
class TemplateCreate(BaseModel):
    name: str
    subject: str
    body: str


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class TemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    subject: str
    body: str
    usage_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime


# Sending Accounts
class ProviderType(str, Enum):
    google = "google"
    outlook = "outlook"
    smtp = "smtp"


class AccountStatus(str, Enum):
    active = "active"
    paused = "paused"
    error = "error"
    warming = "warming"


class SendingAccountCreate(BaseModel):
    email_address: EmailStr
    display_name: Optional[str] = None
    provider: Optional[ProviderType] = ProviderType.smtp
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password_encrypted: Optional[str] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = 993
    imap_username: Optional[str] = None
    imap_password_encrypted: Optional[str] = None
    daily_send_limit: Optional[int] = 50
    status: Optional[AccountStatus] = AccountStatus.active


class SendingAccountUpdate(BaseModel):
    email_address: Optional[EmailStr] = None
    display_name: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password_encrypted: Optional[str] = None
    imap_host: Optional[str] = None
    imap_port: Optional[int] = None
    daily_send_limit: Optional[int] = None
    status: Optional[AccountStatus] = None


class SendingAccountResponse(BaseModel):
    id: str
    user_id: str
    email_address: str
    display_name: Optional[str]
    provider: ProviderType
    status: AccountStatus
    daily_send_limit: Optional[int]
    sent_today: Optional[int]
    warmup_enabled: Optional[bool]
    warmup_progress: Optional[int]
    last_sync_at: Optional[datetime]
    last_error: Optional[str]
    created_at: datetime
    updated_at: datetime


# Domains
class DomainCreate(BaseModel):
    domain: str


class DomainUpdate(BaseModel):
    status: Optional[str] = None


class DomainResponse(BaseModel):
    id: str
    user_id: str
    domain: str
    status: str
    verification_token: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


# Team Members
class TeamMemberInvite(BaseModel):
    member_email: EmailStr
    role: Optional[str] = "member"


class TeamMemberResponse(BaseModel):
    id: str
    user_id: str
    member_email: str
    role: str
    status: str
    invited_at: datetime
    accepted_at: Optional[datetime]
    created_at: datetime


# Unsubscribe
class UnsubscribeCreate(BaseModel):
    email: EmailStr
    reason: Optional[str] = None


class UnsubscribeResponse(BaseModel):
    id: str
    user_id: str
    email: str
    reason: Optional[str]
    created_at: datetime


class DomainBlacklistCreate(BaseModel):
    domain: str


class DomainBlacklistResponse(BaseModel):
    id: str
    user_id: str
    domain: str
    created_at: datetime


# Email Events
class EventType(str, Enum):
    sent = "sent"
    opened = "opened"
    clicked = "clicked"
    replied = "replied"
    bounced = "bounced"
    unsubscribed = "unsubscribed"


class EmailEventResponse(BaseModel):
    id: str
    lead_id: str
    campaign_id: str
    sequence_id: Optional[str]
    sending_account_id: Optional[str]
    event_type: EventType
    step_number: Optional[int]
    message_id: Optional[str]
    subject: Optional[str]
    recipient_email: Optional[str]
    error_message: Optional[str]
    occurred_at: datetime
    lead: Optional[dict] = None
    campaign: Optional[dict] = None


# Inbox
class InboxThread(BaseModel):
    lead_id: str
    lead: dict
    last_event: dict
    has_reply: bool
    event_count: int


# Subscription
class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan: str
    status: str
    start_date: datetime
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
