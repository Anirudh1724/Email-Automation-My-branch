"""
Authentication routes with Redis
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from jose import jwt
from passlib.hash import bcrypt
import redis
from ..database import get_db, get_redis_db
from ..dependencies import get_current_user
from ..config import get_settings
from ..models.auth import (
    LoginRequest, RegisterRequest, TokenResponse,
    ProfileResponse, ProfileUpdate, PasswordUpdate
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    settings = get_settings()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "exp": expire
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: redis.Redis = Depends(get_db)):
    """Sign in with email and password"""
    redis_db = get_redis_db(db)
    
    user = redis_db.get_user_by_email(request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not bcrypt.verify(request.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        user={"id": user["id"], "email": user["email"]}
    )


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: redis.Redis = Depends(get_db)):
    """Create a new user account"""
    redis_db = get_redis_db(db)
    
    # Check if user exists
    existing = redis_db.get_user_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = bcrypt.hash(request.password)
    
    # Create user
    user = redis_db.create_user(
        email=request.email,
        password_hash=password_hash,
        full_name=request.full_name
    )
    
    access_token = create_access_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        user={"id": user["id"], "email": user["email"]}
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Sign out current user"""
    # With JWT, logout is handled client-side by removing the token
    return {"message": "Successfully logged out"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.patch("/profile")
async def update_profile(
    updates: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update current user profile"""
    redis_db = get_redis_db(db)
    
    update_data = updates.model_dump(exclude_unset=True)
    updated = redis_db.update("users", current_user["id"], update_data)
    
    if updated:
        updated.pop("password_hash", None)
    
    return updated


@router.patch("/password")
async def update_password(
    request: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db: redis.Redis = Depends(get_db)
):
    """Update password"""
    redis_db = get_redis_db(db)
    
    password_hash = bcrypt.hash(request.password)
    redis_db.update("users", current_user["id"], {"password_hash": password_hash})
    
    return {"message": "Password updated successfully"}
