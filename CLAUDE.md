# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

pg-inventory — PostgreSQL inventory management application by Worlber Database Services. Manages PG instances across environments (dev/qa/pre-prod/prod), monitors health via Patroni API + direct SQL, tracks HA clusters, and provides search/export functionality.

## Build & Run

```bash
# Start all services (first time)
cp .env.example .env  # Then fill in AES_ENCRYPTION_KEY
docker compose up --build

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000/api/
# - Django Admin: http://localhost:8000/admin/
# - Default login: admin / admin

# Run backend only (for development)
docker compose up db redis backend

# Run frontend only (for development)
cd frontend && npm install && npm run dev

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

## Architecture

- **Backend**: Django 5.1 + DRF, Python 3.12
- **Frontend**: React 18 + TypeScript + Vite + Material UI + Zustand
- **Database**: PostgreSQL 16 (app database)
- **Cache/Broker**: Redis 7
- **Task Queue**: Celery + Celery Beat (monitoring tasks)
- **Deployment**: Docker Compose (db, redis, backend, celery_worker, celery_beat, frontend, nginx)

### Backend Apps
- `apps.accounts` — Auth (username/password + OTP), user management
- `apps.inventory` — Applications, PostgreSQL instances, HA groups, search
- `apps.monitoring` — Patroni API client, PG connector, Celery probe tasks
- `apps.exports` — CSV/Excel export

### Key Files
- `backend/core/encryption.py` — AES-256-GCM for password encryption
- `backend/apps/inventory/models.py` — Core domain models
- `backend/apps/monitoring/tasks.py` — Celery background tasks
- `backend/apps/monitoring/services.py` — Patroni + PG connector services
