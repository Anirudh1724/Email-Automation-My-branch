"""
Email Operations routes with Redis
"""
from fastapi import APIRouter, Depends, BackgroundTasks
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..services.email_sender import send_campaign_emails
from ..services.reply_checker import check_replies

router = APIRouter(prefix="/api/emails", tags=["Email Operations"])


@router.post("/send-campaign")
async def trigger_send_campaign(
    background_tasks: BackgroundTasks,
    campaign_id: str = None,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """
    Trigger sending of campaign emails.
    If campaign_id is provided, send for that campaign only.
    Otherwise, process all active campaigns.
    """
    redis_db = get_redis_db(db)
    background_tasks.add_task(send_campaign_emails, redis_db, campaign_id)
    
    return {"message": "Campaign email sending started", "campaign_id": campaign_id}


@router.post("/check-replies")
async def trigger_check_replies(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """
    Check for email replies via IMAP.
    Runs in background and updates lead statuses.
    """
    redis_db = get_redis_db(db)
    background_tasks.add_task(check_replies, redis_db)
    
    return {"message": "Reply checking started"}
