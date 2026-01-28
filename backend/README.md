# Email Automation Backend

FastAPI backend for the Email Automation platform using **Redis** for data storage.

## Setup

### 1. Start Redis

```bash
# Docker (easiest)
docker run -d --name redis -p 6379:6379 redis

# Or install locally
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
```

### 2. Create virtual environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
# Edit .env with your settings
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your_secure_secret_key
```

### 5. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Data Storage

All data is stored in Redis using the following key patterns:

| Pattern | Description |
|---------|-------------|
| `{entity}:{id}` | Single entity JSON |
| `{entity}:all` | Set of all entity IDs |
| `{entity}:by_user:{user_id}` | Set of entity IDs for a user |
| `{entity}:by_{field}:{value}` | Index by field value |

### Entities

- `users` - User accounts
- `campaigns` - Email campaigns
- `leads` - Contact leads
- `lead_lists` - Lead list containers
- `email_templates` - Reusable templates
- `sending_accounts` - SMTP accounts
- `email_sequences` - Campaign steps
- `email_events` - Tracking events
- `domains` - Verified domains
- `team_members` - Team members
- `subscriptions` - User subscriptions
- `unsubscribe_list` - Unsubscribed emails
- `domain_blacklist` - Blocked domains
