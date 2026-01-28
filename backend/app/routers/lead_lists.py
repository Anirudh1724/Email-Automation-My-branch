"""
Lead Lists routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.lead import LeadListCreate, LeadListUpdate

router = APIRouter(prefix="/api/lead-lists", tags=["Lead Lists"])


@router.get("/")
async def list_lead_lists(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List all lead lists"""
    redis_db = get_redis_db(db)
    lists = redis_db.get_all("lead_lists", user_id=current_user["id"])
    
    # Count leads for each list
    for lead_list in lists:
        leads = redis_db.get_by_field("leads", "lead_list_id", lead_list["id"])
        lead_list["lead_count"] = len(leads)
    
    return lists


@router.get("/{list_id}")
async def get_lead_list(
    list_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get lead list details"""
    redis_db = get_redis_db(db)
    lead_list = redis_db.get("lead_lists", list_id)
    
    if not lead_list or lead_list.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead list not found")
    
    return lead_list


@router.post("/")
async def create_lead_list(
    lead_list: LeadListCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Create a new lead list"""
    redis_db = get_redis_db(db)
    
    list_data = lead_list.model_dump()
    record = redis_db.create("lead_lists", list_data, user_id=current_user["id"])
    
    return record


@router.patch("/{list_id}")
async def update_lead_list(
    list_id: str,
    updates: LeadListUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a lead list"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("lead_lists", list_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead list not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    return redis_db.update("lead_lists", list_id, update_data)


@router.delete("/{list_id}")
async def delete_lead_list(
    list_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a lead list"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("lead_lists", list_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead list not found")
    
    redis_db.delete("lead_lists", list_id)
    
    return {"message": "Lead list deleted"}
