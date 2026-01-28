"""
Email Automation API
FastAPI application entrypoint
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
from .config import get_settings
from .routers import (
    auth_router,
    campaigns_router,
    leads_router,
    lead_lists_router,
    templates_router,
    sending_accounts_router,
    inbox_router,
    email_events_router,
    domains_router,
    team_router,
    subscription_router,
    unsubscribe_router,
    emails_router
)

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Email Automation API",
    description="Backend API for Email Automation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - allow all localhost origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(campaigns_router)
app.include_router(leads_router)
app.include_router(lead_lists_router)
app.include_router(templates_router)
app.include_router(sending_accounts_router)
app.include_router(inbox_router)
app.include_router(email_events_router)
app.include_router(domains_router)
app.include_router(team_router)
app.include_router(subscription_router)
app.include_router(unsubscribe_router)
app.include_router(emails_router)


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "status": "healthy",
        "service": "Email Automation API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
