"""
Email Templates routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.common import TemplateCreate, TemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["Email Templates"])


@router.get("/")
async def list_templates(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List all email templates"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("email_templates", user_id=current_user["id"])


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Get template details"""
    redis_db = get_redis_db(db)
    template = redis_db.get("email_templates", template_id)
    
    if not template or template.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template


@router.post("/")
async def create_template(
    template: TemplateCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Create a new email template"""
    redis_db = get_redis_db(db)
    
    template_data = template.model_dump()
    template_data["usage_count"] = 0
    
    return redis_db.create("email_templates", template_data, user_id=current_user["id"])


@router.patch("/{template_id}")
async def update_template(
    template_id: str,
    updates: TemplateUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a template"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("email_templates", template_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    return redis_db.update("email_templates", template_id, update_data)


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a template"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("email_templates", template_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Template not found")
    
    redis_db.delete("email_templates", template_id)
    
    return {"message": "Template deleted"}


@router.post("/{template_id}/use")
async def increment_template_usage(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Increment template usage count"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("email_templates", template_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Template not found")
    
    new_count = (existing.get("usage_count") or 0) + 1
    return redis_db.update("email_templates", template_id, {"usage_count": new_count})
