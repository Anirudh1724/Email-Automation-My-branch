"""
Campaign routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
import redis
from typing import List
from datetime import datetime
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.campaign import (
    CampaignCreate, CampaignUpdate, CampaignStatusUpdate, CampaignResponse
)

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


@router.get("/")
async def list_campaigns(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List all campaigns for current user"""
    redis_db = get_redis_db(db)
    campaigns = redis_db.get_all("campaigns", user_id=current_user["id"])
    
    # Add sending account info
    for campaign in campaigns:
        if campaign.get("sending_account_id"):
            account = redis_db.get("sending_accounts", campaign["sending_account_id"])
            if account:
                campaign["sending_account"] = {
                    "id": account["id"],
                    "email_address": account.get("email_address"),
                    "display_name": account.get("display_name"),
                    "status": account.get("status")
                }
    
    return campaigns


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get campaign details with sequences"""
    redis_db = get_redis_db(db)
    campaign = redis_db.get("campaigns", campaign_id)
    
    if not campaign or campaign.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get sending account
    if campaign.get("sending_account_id"):
        account = redis_db.get("sending_accounts", campaign["sending_account_id"])
        if account:
            campaign["sending_account"] = {
                "id": account["id"],
                "email_address": account.get("email_address"),
                "display_name": account.get("display_name"),
                "status": account.get("status")
            }
    
    # Get sequences
    sequences = redis_db.get_by_field("email_sequences", "campaign_id", campaign_id)
    sequences.sort(key=lambda x: x.get("step_number", 0))
    
    # Get variants for each sequence
    for seq in sequences:
        variants = redis_db.get_by_field("email_sequence_variants", "sequence_id", seq["id"])
        seq["variants"] = variants
    
    campaign["sequences"] = sequences
    
    return campaign


@router.post("/")
async def create_campaign(
    campaign: CampaignCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Create a new campaign with optional sequences"""
    redis_db = get_redis_db(db)
    
    campaign_data = campaign.model_dump(exclude={"sequences"})
    status_value = None
    if campaign_data.get("status"):
        status_value = campaign_data["status"].value
        campaign_data["status"] = status_value
    
    # Add default values
    campaign_data.setdefault("total_leads", 0)
    campaign_data.setdefault("sent_count", 0)
    campaign_data.setdefault("opened_count", 0)
    campaign_data.setdefault("replied_count", 0)
    campaign_data.setdefault("bounced_count", 0)
    
    # Set started_at if launching immediately
    if status_value == "active":
        from datetime import datetime
        campaign_data["started_at"] = datetime.utcnow().isoformat()
    
    record = redis_db.create("campaigns", campaign_data, user_id=current_user["id"])
    
    # Create sequences if provided
    if campaign.sequences:
        for idx, seq in enumerate(campaign.sequences):
            seq_data = {
                "campaign_id": record["id"],
                "step_number": seq.step_number or idx + 1,
                "subject": seq.subject or "",
                "body": seq.body or "",
                "delay_days": seq.delay_days or 0,
                "delay_hours": seq.delay_hours or 0,
                "delay_minutes": seq.delay_minutes or 0,
                "is_reply": seq.is_reply if seq.is_reply is not None else (idx > 0)
            }
            seq_record = redis_db.create("email_sequences", seq_data)
            redis_db.index_by_field("email_sequences", seq_record["id"], "campaign_id", record["id"])
            
            # Create variants
            if seq.variants:
                for variant in seq.variants:
                    var_data = {
                        "sequence_id": seq_record["id"],
                        "subject": variant.subject,
                        "body": variant.body,
                        "weight": variant.weight or 50,
                        "sent_count": 0,
                        "opened_count": 0,
                        "replied_count": 0,
                        "clicked_count": 0
                    }
                    var_record = redis_db.create("email_sequence_variants", var_data)
                    redis_db.index_by_field("email_sequence_variants", var_record["id"], "sequence_id", seq_record["id"])
    
    # If campaign is created with active status, start sending emails
    if status_value == "active":
        import logging
        from ..services.email_sender import send_campaign_emails
        
        logger = logging.getLogger(__name__)
        logger.info(f"Campaign {record['id']} created with active status - triggering email send")
        
        # FastAPI's BackgroundTasks handles async functions
        background_tasks.add_task(send_campaign_emails, redis_db, record["id"])
        record["_message"] = "Campaign launched! Emails are being sent in the background."
    
    return record


@router.patch("/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    updates: CampaignUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a campaign"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("campaigns", campaign_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    if update_data.get("status"):
        update_data["status"] = update_data["status"].value
    
    return redis_db.update("campaigns", campaign_id, update_data)


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a campaign"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("campaigns", campaign_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Delete related sequences
    sequences = redis_db.get_by_field("email_sequences", "campaign_id", campaign_id)
    for seq in sequences:
        # Delete variants
        variants = redis_db.get_by_field("email_sequence_variants", "sequence_id", seq["id"])
        for var in variants:
            redis_db.delete("email_sequence_variants", var["id"])
        redis_db.delete("email_sequences", seq["id"])
    
    redis_db.delete("campaigns", campaign_id)
    
    return {"message": "Campaign deleted"}


@router.patch("/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str,
    status_update: CampaignStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update campaign status - automatically sends emails when launched"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("campaigns", campaign_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = {"status": status_update.status.value}
    
    if status_update.status.value == "active":
        update_data["started_at"] = datetime.utcnow().isoformat()
        
        # Trigger email sending in background when campaign is launched
        from ..services.email_sender import send_campaign_emails
        background_tasks.add_task(send_campaign_emails, redis_db, campaign_id)
        
    elif status_update.status.value == "completed":
        update_data["completed_at"] = datetime.utcnow().isoformat()
    
    updated = redis_db.update("campaigns", campaign_id, update_data)
    
    if status_update.status.value == "active":
        updated["_message"] = "Campaign launched! Emails are being sent in the background."
    
    return updated

