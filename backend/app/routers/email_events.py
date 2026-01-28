"""
Email Events routes with Redis
"""
from fastapi import APIRouter, Depends, Query, Response
import redis
from typing import Optional
from datetime import datetime
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/email-events", tags=["Email Events"])

# 1x1 transparent GIF
TRANSPARENT_GIF = bytes([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
    0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x2c,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02,
    0x02, 0x44, 0x01, 0x00, 0x3b
])


@router.get("/")
async def list_email_events(
    campaign_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List email events, optionally filtered by campaign"""
    redis_db = get_redis_db(db)
    
    if campaign_id:
        events = redis_db.get_by_field("email_events", "campaign_id", campaign_id)
    else:
        events = redis_db.get_all("email_events")
    
    # Add lead and campaign info, filter by user
    result = []
    for event in events:
        lead = redis_db.get("leads", event.get("lead_id", ""))
        if not lead or lead.get("user_id") != current_user["id"]:
            continue
        
        event["lead"] = {
            "id": lead["id"],
            "email": lead.get("email"),
            "first_name": lead.get("first_name"),
            "last_name": lead.get("last_name")
        }
        
        if event.get("campaign_id"):
            campaign = redis_db.get("campaigns", event["campaign_id"])
            if campaign:
                event["campaign"] = {"id": campaign["id"], "name": campaign.get("name")}
        
        result.append(event)
    
    result.sort(key=lambda x: x.get("occurred_at", ""), reverse=True)
    return result


@router.get("/track-open")
async def track_open(
    id: str = Query(..., description="Event ID to track"),
    db: redis.Redis = Depends(get_db)
):
    """
    Tracking pixel endpoint - records email opens.
    Returns a 1x1 transparent GIF.
    """
    try:
        redis_db = get_redis_db(db)
        sent_event = redis_db.get("email_events", id)
        
        if sent_event:
            # Record the open event
            open_event = redis_db.create("email_events", {
                "campaign_id": sent_event.get("campaign_id"),
                "lead_id": sent_event.get("lead_id"),
                "sending_account_id": sent_event.get("sending_account_id"),
                "sequence_id": sent_event.get("sequence_id"),
                "step_number": sent_event.get("step_number"),
                "event_type": "opened",
                "occurred_at": datetime.utcnow().isoformat()
            })
            
            # Index by lead_id and campaign_id
            if sent_event.get("lead_id"):
                redis_db.index_by_field("email_events", open_event["id"], "lead_id", sent_event["lead_id"])
            if sent_event.get("campaign_id"):
                redis_db.index_by_field("email_events", open_event["id"], "campaign_id", sent_event["campaign_id"])
            
            # Update lead status
            if sent_event.get("lead_id"):
                redis_db.update("leads", sent_event["lead_id"], {
                    "status": "opened",
                    "opened_at": datetime.utcnow().isoformat()
                })
    except Exception as e:
        print(f"Error tracking open: {e}")
    
    return Response(
        content=TRANSPARENT_GIF,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )
