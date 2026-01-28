"""
Leads routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException, Query
import redis
from typing import Optional
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.lead import (
    LeadCreate, LeadBulkCreate, LeadUpdate, LeadBulkDelete, LeadResponse
)

router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.get("/")
async def list_leads(
    campaign_id: Optional[str] = Query(None),
    lead_list_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List leads with optional filters"""
    redis_db = get_redis_db(db)
    
    if campaign_id:
        leads = redis_db.get_by_field("leads", "campaign_id", campaign_id)
    elif lead_list_id:
        leads = redis_db.get_by_field("leads", "lead_list_id", lead_list_id)
    else:
        leads = redis_db.get_all("leads", user_id=current_user["id"])
    
    # Filter by user
    leads = [l for l in leads if l.get("user_id") == current_user["id"]]
    
    # Add campaign info
    for lead in leads:
        if lead.get("campaign_id"):
            campaign = redis_db.get("campaigns", lead["campaign_id"])
            if campaign:
                lead["campaign"] = {"id": campaign["id"], "name": campaign.get("name")}
    
    leads.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return leads


@router.get("/{lead_id}")
async def get_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get lead details"""
    redis_db = get_redis_db(db)
    lead = redis_db.get("leads", lead_id)
    
    if not lead or lead.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Add campaign info
    if lead.get("campaign_id"):
        campaign = redis_db.get("campaigns", lead["campaign_id"])
        if campaign:
            lead["campaign"] = {"id": campaign["id"], "name": campaign.get("name")}
    
    return lead


@router.post("/")
async def create_lead(
    lead: LeadCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Create a single lead"""
    redis_db = get_redis_db(db)
    
    lead_data = lead.model_dump()
    if lead_data.get("status"):
        lead_data["status"] = lead_data["status"].value
    
    # Add default values
    lead_data.setdefault("status", "active")  # Default to active so leads can be emailed
    lead_data.setdefault("current_step", 0)
    lead_data.setdefault("custom_fields", {})
    
    record = redis_db.create("leads", lead_data, user_id=current_user["id"])
    
    # Index by lead_list_id
    if lead.lead_list_id:
        redis_db.index_by_field("leads", record["id"], "lead_list_id", lead.lead_list_id)
    
    # Index by campaign_id
    if lead.campaign_id:
        redis_db.index_by_field("leads", record["id"], "campaign_id", lead.campaign_id)
    
    return record


@router.post("/bulk")
async def create_leads_bulk(
    bulk: LeadBulkCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Import leads in bulk"""
    redis_db = get_redis_db(db)
    created = []
    
    for lead in bulk.leads:
        lead_data = {
            "lead_list_id": bulk.lead_list_id,
            "campaign_id": bulk.campaign_id,
            "email": lead.get("email"),
            "first_name": lead.get("first_name"),
            "last_name": lead.get("last_name"),
            "company": lead.get("company"),
            "custom_fields": lead.get("custom_fields", {}),
            "status": "active",
            "current_step": 0
        }
        
        record = redis_db.create("leads", lead_data, user_id=current_user["id"])
        
        if bulk.lead_list_id:
            redis_db.index_by_field("leads", record["id"], "lead_list_id", bulk.lead_list_id)
        if bulk.campaign_id:
            redis_db.index_by_field("leads", record["id"], "campaign_id", bulk.campaign_id)
        
        created.append(record)
    
    return created


@router.patch("/{lead_id}")
async def update_lead(
    lead_id: str,
    updates: LeadUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a lead"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("leads", lead_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    if update_data.get("status"):
        update_data["status"] = update_data["status"].value
    
    return redis_db.update("leads", lead_id, update_data)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a lead"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("leads", lead_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    redis_db.delete("leads", lead_id)
    
    return {"message": "Lead deleted"}


@router.post("/bulk/delete")
async def delete_leads_bulk(
    bulk: LeadBulkDelete,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete multiple leads"""
    redis_db = get_redis_db(db)
    
    for lead_id in bulk.ids:
        existing = redis_db.get("leads", lead_id)
        if existing and existing.get("user_id") == current_user["id"]:
            redis_db.delete("leads", lead_id)
    
    return {"message": f"{len(bulk.ids)} leads deleted"}
