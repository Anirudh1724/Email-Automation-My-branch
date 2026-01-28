"""
Redis database client and helper functions
"""
import redis
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from functools import lru_cache
from .config import get_settings


@lru_cache()
def get_redis_client() -> redis.Redis:
    """Get cached Redis client"""
    settings = get_settings()
    return redis.from_url(settings.redis_url, decode_responses=True)


def get_db() -> redis.Redis:
    """Dependency to get database client"""
    return get_redis_client()


class RedisDB:
    """
    Redis database helper for managing entities.
    Uses Redis hashes and sets to simulate a document database.
    
    Data structure:
    - {entity}:{id} -> JSON string of entity data
    - {entity}:all -> Set of all entity IDs
    - {entity}:by_user:{user_id} -> Set of entity IDs for a user
    - {entity}:by_{field}:{value} -> Set of entity IDs with that field value
    """
    
    def __init__(self, client: redis.Redis):
        self.client = client
    
    def _generate_id(self) -> str:
        """Generate a unique ID"""
        return str(uuid.uuid4())
    
    def _now(self) -> str:
        """Get current timestamp as ISO string"""
        return datetime.utcnow().isoformat()
    
    # Generic CRUD operations
    
    def create(self, entity: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new entity"""
        entity_id = self._generate_id()
        now = self._now()
        
        record = {
            "id": entity_id,
            "created_at": now,
            "updated_at": now,
            **data
        }
        
        if user_id:
            record["user_id"] = user_id
        
        # Store the entity
        self.client.set(f"{entity}:{entity_id}", json.dumps(record))
        
        # Add to all entities set
        self.client.sadd(f"{entity}:all", entity_id)
        
        # Index by user if applicable
        if user_id:
            self.client.sadd(f"{entity}:by_user:{user_id}", entity_id)
        
        return record
    
    def get(self, entity: str, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get a single entity by ID"""
        data = self.client.get(f"{entity}:{entity_id}")
        return json.loads(data) if data else None
    
    def get_all(self, entity: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all entities, optionally filtered by user"""
        if user_id:
            ids = self.client.smembers(f"{entity}:by_user:{user_id}")
        else:
            ids = self.client.smembers(f"{entity}:all")
        
        results = []
        for entity_id in ids:
            data = self.get(entity, entity_id)
            if data:
                results.append(data)
        
        # Sort by created_at descending
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results
    
    def get_by_field(self, entity: str, field: str, value: str) -> List[Dict[str, Any]]:
        """Get entities by a specific field value"""
        ids = self.client.smembers(f"{entity}:by_{field}:{value}")
        results = []
        for entity_id in ids:
            data = self.get(entity, entity_id)
            if data:
                results.append(data)
        return results
    
    def update(self, entity: str, entity_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an entity"""
        existing = self.get(entity, entity_id)
        if not existing:
            return None
        
        updated = {
            **existing,
            **updates,
            "updated_at": self._now()
        }
        
        self.client.set(f"{entity}:{entity_id}", json.dumps(updated))
        return updated
    
    def delete(self, entity: str, entity_id: str) -> bool:
        """Delete an entity"""
        existing = self.get(entity, entity_id)
        if not existing:
            return False
        
        # Remove from main storage
        self.client.delete(f"{entity}:{entity_id}")
        
        # Remove from all entities set
        self.client.srem(f"{entity}:all", entity_id)
        
        # Remove from user index
        if "user_id" in existing:
            self.client.srem(f"{entity}:by_user:{existing['user_id']}", entity_id)
        
        return True
    
    def index_by_field(self, entity: str, entity_id: str, field: str, value: str):
        """Add entity to a field index"""
        self.client.sadd(f"{entity}:by_{field}:{value}", entity_id)
    
    def remove_from_index(self, entity: str, entity_id: str, field: str, value: str):
        """Remove entity from a field index"""
        self.client.srem(f"{entity}:by_{field}:{value}", entity_id)
    
    # User-specific operations
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        users = self.get_by_field("users", "email", email)
        return users[0] if users else None
    
    def create_user(self, email: str, password_hash: str, full_name: Optional[str] = None) -> Dict[str, Any]:
        """Create a new user"""
        user = self.create("users", {
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "company": None,
            "timezone": "America/New_York"
        })
        
        # Index by email
        self.index_by_field("users", user["id"], "email", email)
        
        return user


def get_redis_db(client: redis.Redis = None) -> RedisDB:
    """Get RedisDB helper instance"""
    if client is None:
        client = get_redis_client()
    return RedisDB(client)
