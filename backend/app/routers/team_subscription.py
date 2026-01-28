"""
Team, Subscription, and Unsubscribe routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException
import redis
from datetime import datetime
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.common import (
    TeamMemberInvite,
    UnsubscribeCreate,
    DomainBlacklistCreate
)

# Team Router
team_router = APIRouter(prefix="/api/team", tags=["Team"])


@team_router.get("/")
async def list_team_members(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List team members"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("team_members", user_id=current_user["id"])


@team_router.post("/invite")
async def invite_team_member(
    invite: TeamMemberInvite,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Invite a team member"""
    redis_db = get_redis_db(db)
    
    invite_data = invite.model_dump()
    invite_data["status"] = "pending"
    invite_data["invited_at"] = datetime.utcnow().isoformat()
    
    return redis_db.create("team_members", invite_data, user_id=current_user["id"])


@team_router.delete("/{member_id}")
async def remove_team_member(
    member_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Remove a team member"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("team_members", member_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    redis_db.delete("team_members", member_id)
    
    return {"message": "Team member removed"}


# Subscription Router
subscription_router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


@subscription_router.get("/")
async def get_subscription(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get user subscription"""
    redis_db = get_redis_db(db)
    
    subs = redis_db.get_all("subscriptions", user_id=current_user["id"])
    
    if subs:
        return subs[0]
    
    # Return default free plan
    return {
        "id": "",
        "user_id": current_user["id"],
        "plan": "free",
        "status": "active",
        "start_date": current_user.get("created_at"),
        "end_date": None,
        "created_at": current_user.get("created_at"),
        "updated_at": current_user.get("updated_at")
    }


# Unsubscribe Router
unsubscribe_router = APIRouter(prefix="/api/unsubscribe", tags=["Unsubscribe"])


@unsubscribe_router.get("/")
async def list_unsubscribed(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List unsubscribed emails"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("unsubscribe_list", user_id=current_user["id"])


@unsubscribe_router.post("/")
async def add_to_unsubscribe(
    entry: UnsubscribeCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Add email to unsubscribe list"""
    redis_db = get_redis_db(db)
    
    entry_data = entry.model_dump()
    return redis_db.create("unsubscribe_list", entry_data, user_id=current_user["id"])


@unsubscribe_router.delete("/{entry_id}")
async def remove_from_unsubscribe(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Remove email from unsubscribe list"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("unsubscribe_list", entry_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    redis_db.delete("unsubscribe_list", entry_id)
    
    return {"message": "Removed from unsubscribe list"}


@unsubscribe_router.get("/blacklist")
async def list_blacklist(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List blacklisted domains"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("domain_blacklist", user_id=current_user["id"])


@unsubscribe_router.post("/blacklist")
async def add_to_blacklist(
    entry: DomainBlacklistCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Add domain to blacklist"""
    redis_db = get_redis_db(db)
    
    entry_data = entry.model_dump()
    return redis_db.create("domain_blacklist", entry_data, user_id=current_user["id"])


@unsubscribe_router.delete("/blacklist/{entry_id}")
async def remove_from_blacklist(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Remove domain from blacklist"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("domain_blacklist", entry_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    redis_db.delete("domain_blacklist", entry_id)
    
    return {"message": "Removed from blacklist"}
