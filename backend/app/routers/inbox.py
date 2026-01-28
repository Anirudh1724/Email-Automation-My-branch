"""
Inbox routes with Redis
"""
from fastapi import APIRouter, Depends
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/inbox", tags=["Inbox"])


@router.get("/threads")
async def list_threads(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List email threads grouped by lead"""
    redis_db = get_redis_db(db)
    
    # Get all email events
    events = redis_db.get_all("email_events")
    
    # Group by lead_id
    threads_map = {}
    for event in events:
        lead_id = event.get("lead_id")
        if not lead_id or lead_id in threads_map:
            continue
        
        lead = redis_db.get("leads", lead_id)
        if not lead or lead.get("user_id") != current_user["id"]:
            continue
        
        lead_events = [e for e in events if e.get("lead_id") == lead_id]
        has_reply = any(e.get("event_type") == "replied" for e in lead_events)
        
        threads_map[lead_id] = {
            "lead_id": lead_id,
            "lead": {
                "email": lead.get("email"),
                "first_name": lead.get("first_name"),
                "last_name": lead.get("last_name"),
                "company": lead.get("company")
            },
            "last_event": event,
            "has_reply": has_reply,
            "event_count": len(lead_events)
        }
    
    return list(threads_map.values())


@router.get("/threads/{lead_id}")
async def get_thread_history(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get email thread history for a lead"""
    redis_db = get_redis_db(db)
    
    # Verify lead belongs to user
    lead = redis_db.get("leads", lead_id)
    if not lead or lead.get("user_id") != current_user["id"]:
        return []
    
    # Get events for this lead
    events = redis_db.get_by_field("email_events", "lead_id", lead_id)
    
    # Add lead and campaign info
    for event in events:
        event["lead"] = {
            "id": lead["id"],
            "email": lead.get("email"),
            "first_name": lead.get("first_name"),
            "last_name": lead.get("last_name"),
            "company": lead.get("company")
        }
        if event.get("campaign_id"):
            campaign = redis_db.get("campaigns", event["campaign_id"])
            if campaign:
                event["campaign"] = {"id": campaign["id"], "name": campaign.get("name")}
    
    events.sort(key=lambda x: x.get("occurred_at", ""))
    return events
