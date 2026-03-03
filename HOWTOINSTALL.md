# Worlber PG Inventory — Installation Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+

## Quick Start

### 1. Pull the images

```bash
docker pull worlber64/pginventory:backend-v1.0.0
docker pull worlber64/pginventory:frontend-v1.0.0
docker pull worlber64/pginventory:celery-worker-v1.0.0
docker pull worlber64/pginventory:celery-beat-v1.0.0
```

### 2. Create a `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: pguser
      POSTGRES_PASSWORD: pgpass
      POSTGRES_DB: pg_inventory
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pguser"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    image: worlber64/pginventory:backend-v1.0.0
    command: >
      sh -c "python manage.py makemigrations &&
             python manage.py migrate &&
             python manage.py create_superuser_if_not_exists &&
             python manage.py runserver 0.0.0.0:8000"
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery_worker:
    image: worlber64/pginventory:celery-worker-v1.0.0
    command: celery -A pg_inventory worker -l info
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery_beat:
    image: worlber64/pginventory:celery-beat-v1.0.0
    command: celery -A pg_inventory beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    env_file:
      - .env
    depends_on:
      backend:
        condition: service_started
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    image: worlber64/pginventory:frontend-v1.0.0
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 3. Create a `.env` file

Create a `.env` file in the same directory as `docker-compose.yml`:

```env
# Django
DJANGO_SECRET_KEY=change-me-to-a-random-secret-key
DJANGO_SETTINGS_MODULE=pg_inventory.settings.development
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://pguser:pgpass@db:5432/pg_inventory
POSTGRES_USER=pguser
POSTGRES_PASSWORD=pgpass
POSTGRES_DB=pg_inventory

# Redis
REDIS_URL=redis://redis:6379/0

# AES-256 Encryption Key (32-byte base64-encoded)
# Generate your own: python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
AES_ENCRYPTION_KEY=6uAf0QteKNQWmx32JTvzwmWnMsNOxEdGF9HV46juvEA=

# Default admin user (created on first run)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=admin
DJANGO_SUPERUSER_EMAIL=admin@worlber.com
```

> **Important:** For production, change `DJANGO_SECRET_KEY`, `AES_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, and the superuser password.

### 4. Start the application

```bash
docker compose up -d
```

Wait about 30 seconds for all services to initialize.

### 5. Access the application

| Service         | URL                          |
|-----------------|------------------------------|
| Frontend        | http://localhost:3000         |
| Backend API     | http://localhost:8000/api/    |
| Django Admin    | http://localhost:8000/admin/  |

## Default Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin    | Admin |

> Change the default password after first login.

## Useful Commands

```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f celery_worker

# Stop all services
docker compose down

# Stop and remove data
docker compose down -v

# Create additional admin user
docker compose exec backend python manage.py createsuperuser

# Restart a specific service
docker compose restart backend
```

## Background Tasks

The following tasks run automatically:

| Task                     | Interval  | Description                                      |
|--------------------------|-----------|--------------------------------------------------|
| poll_all_instances       | 5 minutes | Probes all PostgreSQL instances for health status |
| poll_patroni_clusters    | 2 minutes | Checks Patroni API for HA cluster member roles   |
| cleanup_old_probe_logs   | 24 hours  | Deletes probe log entries older than 30 days      |

## Updating to a New Version

```bash
# Pull new images
docker pull worlber64/pginventory:backend-v1.0.0
docker pull worlber64/pginventory:frontend-v1.0.0
docker pull worlber64/pginventory:celery-worker-v1.0.0
docker pull worlber64/pginventory:celery-beat-v1.0.0

# Restart with new images
docker compose up -d
```

Replace `v1.0.0` with the desired version tag. Migrations run automatically on backend startup.
