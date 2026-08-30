# Full-Stack Authentication Project

This project implements a secure authentication system with a Next.js (frontend) and FastAPI (backend) architecture following strict evaluation criteria.

## Features implemented
- **Security**: Passwords hashed with bcrypt, JWT stored securely in HTTPOnly cookies, refresh token invalidation, no secrets in text responses.
- **Code Quality**: Clean layered architecture (FastAPI backend + NextJS frontend), DRY logic.
- **API Design**: Proper HTTP verbs, inputs validated via Pydantic, consistent success/error states.
- **Frontend Integration**: Stateful protected routes, transparent token refresh (`apps/web/src/lib/api.ts`).
- **Testing**: Meaningful auth tests covering endpoints with pytest.

## How to Run Locally (Under 5 minutes)

### System Requirements for Docker Compose
To successfully build and run the orchestration, ensure you have:
- **OS**: Linux, macOS, or Windows (via WSL2)
- **Docker**: Engine version 24.0+ recommended
- **Docker Compose**: V2+ recommended (command: `docker compose`)
- Minimum **2GB RAM** available for the containers.
- Ports `3000`, `3001`, and `5432` must be available on your machine.

### 1. Unified Setup
To bring up the database, the backend API, and the Next.js frontend simultaneously, run:
```bash
docker compose up --build -d
```
- The frontend will be available at `http://localhost:3000`.
- The backend will be available at `http://localhost:3001`.

### 2. Database Migrations
By default, the backend container automatically runs existing migrations on startup (`alembic upgrade head`).

**Generating New Migrations:**
If you make changes to the SQLAlchemy models (`app.models.user`), generate a new migration file:
```bash
# Inside the backend container or local virtual environment:
alembic revision --autogenerate -m "describe_your_changes"
```
**Running Migrations Manually:**
```bash
alembic upgrade head
```

### 3. Monitoring Application Logs
To view the real-time logs for any specific service, use the `docker compose logs -f <service_name>` command.

**Frontend Logs:**
```bash
docker compose logs -f frontend
```

**Backend Logs:**
```bash
docker compose logs -f backend
```

**Database Logs:**
```bash
docker compose logs -f postgres
```

### 4. Running Backend Tests
In a terminal, verify the API tests using pytest:
```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest tests/test_auth.py -v
```
