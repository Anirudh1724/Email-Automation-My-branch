"""
Routers module - exports all API routers
"""
from .auth import router as auth_router
from .campaigns import router as campaigns_router
from .leads import router as leads_router
from .lead_lists import router as lead_lists_router
from .templates import router as templates_router
from .sending_accounts import router as sending_accounts_router
from .inbox import router as inbox_router
from .email_events import router as email_events_router
from .domains import router as domains_router
from .team_subscription import team_router, subscription_router, unsubscribe_router
from .emails import router as emails_router

__all__ = [
    "auth_router",
    "campaigns_router",
    "leads_router",
    "lead_lists_router",
    "templates_router",
    "sending_accounts_router",
    "inbox_router",
    "email_events_router",
    "domains_router",
    "team_router",
    "subscription_router",
    "unsubscribe_router",
    "emails_router"
]
