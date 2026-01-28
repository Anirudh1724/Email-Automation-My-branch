"""
Sending Accounts routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.common import SendingAccountCreate, SendingAccountUpdate

router = APIRouter(prefix="/api/sending-accounts", tags=["Sending Accounts"])


@router.get("/")
async def list_sending_accounts(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List all sending accounts"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("sending_accounts", user_id=current_user["id"])


@router.get("/{account_id}")
async def get_sending_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get sending account details"""
    redis_db = get_redis_db(db)
    account = redis_db.get("sending_accounts", account_id)
    
    if not account or account.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Sending account not found")
    
    return account


@router.post("/")
async def create_sending_account(
    account: SendingAccountCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Create a new sending account"""
    redis_db = get_redis_db(db)
    
    account_data = account.model_dump()
    if account_data.get("provider"):
        account_data["provider"] = account_data["provider"].value
    if account_data.get("status"):
        account_data["status"] = account_data["status"].value
    
    # Add defaults
    account_data.setdefault("status", "active")  # Default to active so it appears in campaign builder
    account_data.setdefault("sent_today", 0)
    account_data.setdefault("warmup_enabled", False)
    account_data.setdefault("warmup_progress", 0)
    
    return redis_db.create("sending_accounts", account_data, user_id=current_user["id"])


@router.patch("/{account_id}")
async def update_sending_account(
    account_id: str,
    updates: SendingAccountUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a sending account"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("sending_accounts", account_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Sending account not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    if update_data.get("status"):
        update_data["status"] = update_data["status"].value
    
    return redis_db.update("sending_accounts", account_id, update_data)


@router.delete("/{account_id}")
async def delete_sending_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a sending account"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("sending_accounts", account_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Sending account not found")
    
    redis_db.delete("sending_accounts", account_id)
    
    return {"message": "Sending account deleted"}
