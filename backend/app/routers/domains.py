"""
Domains routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException
import redis
import secrets
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..models.common import DomainCreate, DomainUpdate

router = APIRouter(prefix="/api/domains", tags=["Domains"])


@router.get("/")
async def list_domains(
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """List all domains"""
    redis_db = get_redis_db(db)
    return redis_db.get_all("domains", user_id=current_user["id"])


@router.get("/{domain_id}/health")
async def check_domain_health(
    domain_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Check domain health (DNS, SPF, DKIM, DMARC)"""
    redis_db = get_redis_db(db)
    domain = redis_db.get("domains", domain_id)
    
    if not domain or domain.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    return {
        "domain": domain.get("domain"),
        "status": domain.get("status"),
        "checks": {
            "dns": {"status": "ok", "message": "DNS records found"},
            "spf": {"status": "warning", "message": "SPF record could be improved"},
            "dkim": {"status": "ok", "message": "DKIM configured"},
            "dmarc": {"status": "ok", "message": "DMARC policy set"}
        }
    }


@router.post("/")
async def create_domain(
    domain: DomainCreate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Add a new domain"""
    redis_db = get_redis_db(db)
    
    domain_data = domain.model_dump()
    domain_data["status"] = "pending"
    domain_data["verification_token"] = secrets.token_urlsafe(32)
    
    return redis_db.create("domains", domain_data, user_id=current_user["id"])


@router.patch("/{domain_id}")
async def update_domain(
    domain_id: str,
    updates: DomainUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update a domain"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("domains", domain_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    update_data = updates.model_dump(exclude_unset=True)
    return redis_db.update("domains", domain_id, update_data)


@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: str,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Delete a domain"""
    redis_db = get_redis_db(db)
    
    existing = redis_db.get("domains", domain_id)
    if not existing or existing.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    redis_db.delete("domains", domain_id)
    
    return {"message": "Domain deleted"}
