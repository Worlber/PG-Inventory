<p align="center">
  <img src="https://cdn.visualgpt.io/visualgpt/prediction_image/gemini_watermark_remover/07a45285376047fb57f573f2e2952b8d.png" alt="PG Inventory" width="200" style="border-radius: 12px;" />
</p>

<h1 align="center">PG Inventory</h1>

<p align="center">
  <strong>PostgreSQL Infrastructure Inventory & Monitoring Platform</strong><br/>
  Built by <a href="https://worlber.com">Worlber Database Services</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.1-green?logo=django" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## Overview

PG Inventory is a centralized management platform for PostgreSQL instances across multiple environments (Development, QA, Pre-Production, Production). It provides real-time health monitoring via direct SQL probes and Patroni API integration, tracks HA clusters, manages database metadata, and offers search/export functionality.

### Key Features

- **Instance Management** — Add, edit, and delete PostgreSQL instances with encrypted credential storage (AES-256-GCM)
- **Real-Time Health Monitoring** — Automatic probing of PG instances every 2 minutes to track status (UP/DOWN), version, OS, CPU, and RAM
- **Patroni HA Cluster Tracking** — Polls Patroni REST API to monitor cluster member roles (leader, replica, standby_leader)
- **Application Grouping** — Organize instances by application for logical grouping and easy navigation
- **Environment Dashboard** — Visual overview of instances across dev, QA, pre-prod, and production environments
- **Role-Based Access Control** — Admin and Viewer roles; viewers can browse but not modify data
- **OTP Two-Factor Authentication** — TOTP-based 2FA with QR code setup for enhanced security
- **CSV/Excel Export** — Export database lists, user lists, and full inventory data
- **Global Search** — Search across instances, applications, and HA groups
- **User Management** — Create, edit, and delete users with role assignment

---

## Architecture

```
                    ┌─────────────┐
                    │   Nginx     │  (Production reverse proxy)
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐     ┌─────────┴─────────┐
     │  React Frontend  │     │  Django Backend    │
     │  (Vite + MUI)    │     │  (DRF API)         │
     │  Port 3000       │     │  Port 8000         │
     └─────────────────┘     └────────┬───────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
           ┌───────┴───────┐ ┌───────┴──────┐ ┌────────┴───────┐
           │  PostgreSQL 16 │ │  Redis 7     │ │ Celery Worker  │
           │  (App DB)      │ │  (Broker)    │ │ + Celery Beat  │
           └───────────────┘ └──────────────┘ └────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Material UI (MUI), Zustand |
| **Backend** | Django 5.1, Django REST Framework, Python 3.12 |
| **Database** | PostgreSQL 16 (application database) |
| **Cache/Broker** | Redis 7 (Celery message broker) |
| **Task Queue** | Celery + Celery Beat (periodic monitoring tasks) |
| **Auth** | Session-based + TOTP/OTP two-factor authentication |
| **Encryption** | AES-256-GCM for stored passwords |
| **Deployment** | Docker Compose (6 services) |

### Backend Apps

| App | Purpose |
|-----|---------|
| `apps.accounts` | Authentication (username/password + OTP), user management, role-based permissions |
| `apps.inventory` | Applications, PostgreSQL instances, HA groups, global search, dashboard stats |
| `apps.monitoring` | Patroni API client, PG connector service, Celery probe tasks, health refresh endpoints |
| `apps.exports` | CSV and Excel export for databases, users, and full inventory |

### Key Backend Files

| File | Description |
|------|-------------|
| `core/encryption.py` | AES-256-GCM encryption/decryption for instance passwords |
| `core/authentication.py` | CSRF-exempt session authentication for SPA |
| `core/permissions.py` | `IsAdminOrReadOnly` permission class for role-based access |
| `apps/inventory/models.py` | Core domain models: Application, PostgreSQLInstance, HAGroup, DatabaseInfo, DatabaseUser |
| `apps/inventory/views.py` | CRUD views with auto-probe on instance creation |
| `apps/monitoring/services.py` | `PGConnectorService` (SQL probe) and `PatroniService` (REST API) |
| `apps/monitoring/tasks.py` | Celery tasks: `poll_all_instances`, `poll_patroni_clusters`, `cleanup_old_probe_logs` |
| `apps/monitoring/views.py` | Synchronous single and bulk refresh endpoints (parallel probing with ThreadPoolExecutor) |

### Frontend Structure

| Component | Description |
|-----------|-------------|
| `DashboardPage` | Main dashboard with tabs: Applications, Environments, Patroni Clusters |
| `ApplicationDetailPage` | Application detail with instance list, edit/delete |
| `PgNodeDetail` | Instance detail: version, OS, CPU, RAM, databases, users, with live refresh |
| `InstanceForm` | Add/edit PostgreSQL instance form |
| `UserManagementPage` | Admin user management (create, edit roles, delete) |
| `ProfilePage` | OTP setup/disable with QR code |
| `LoginPage` | Login with optional OTP verification |

### Background Tasks

| Task | Interval | Description |
|------|----------|-------------|
| `poll_all_instances` | 2 minutes | Probes all PG instances via SQL for status, version, databases, users, CPU, RAM |
| `poll_patroni_clusters` | 2 minutes | Polls Patroni REST API for HA cluster member roles |
| `cleanup_old_probe_logs` | 24 hours | Deletes probe log entries older than 30 days |

### Monitoring Logic

- Instances are probed via direct SQL connection (`psycopg3`) with a 10-second connect timeout
- Failed probes are retried once before counting as a failure
- An instance is only marked DOWN after **3 consecutive failures** (prevents flickering)
- Cached metadata (databases, users, version, CPU, RAM) is preserved on probe failure
- Dashboard auto-probes all instances on page load using parallel ThreadPoolExecutor
- Celery worker probes all instances immediately on startup

---

## Installation

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2+

### Quick Start with Docker Hub Images

**1. Create a project directory**

```bash
mkdir pg-inventory && cd pg-inventory
```

**2. Create `.env` file**

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

**3. Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-pguser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-pgpass}
      POSTGRES_DB: ${POSTGRES_DB:-pg_inventory}
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
      backend:
        condition: service_started
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

**4. Start the application**

```bash
docker compose pull
docker compose up -d
```

Wait ~30 seconds for all services to initialize.

**5. Access the application**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin | Admin |

> Change the default password after first login.

### Build from Source

```bash
git clone https://github.com/Worlber/PG-Inventory.git
cd PG-Inventory
cp .env.example .env   # Edit and set AES_ENCRYPTION_KEY
docker compose up --build -d
```

---

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

---

## Docker Hub Images

All images are available at [`worlber64/pginventory`](https://hub.docker.com/r/worlber64/pginventory):

| Tag | Description |
|-----|-------------|
| `backend-v1.0.0` | Django REST Framework backend |
| `frontend-v1.0.0` | React/TypeScript frontend |
| `celery-worker-v1.0.0` | Celery task worker |
| `celery-beat-v1.0.0` | Celery periodic task scheduler |

---

## Contact

<p align="center">
  <strong>Worlber Database Services</strong><br/>
  Enterprise PostgreSQL Solutions
</p>

| | |
|---|---|
| **Website** | [worlber.com](https://worlber.com) |
| **Email** | [ahmed@worlber.com](mailto:ahmed@worlber.com) |
| **GitHub** | [github.com/Worlber](https://github.com/Worlber) |
| **Docker Hub** | [hub.docker.com/r/worlber64/pginventory](https://hub.docker.com/r/worlber64/pginventory) |

---

<p align="center">
  <sub>Built with Django, React, and PostgreSQL by Worlber Database Services</sub>
</p>
