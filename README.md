# Task Management API Docker Run

Run the full backend stack (API + PostgreSQL + Redis + PgAdmin) with one command.

## One Command

```bash
docker compose up --build
```

## Service URLs

- Backend API: http://localhost:7549/api/v1
- Swagger Docs: http://localhost:7549/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- PgAdmin: http://localhost:5050

## Stop and Clean

```bash
docker compose down -v
```
