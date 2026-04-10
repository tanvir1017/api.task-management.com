# Task Management API

A clean NestJS backend for task management with authentication, authorization, and audit logging.

## Prerequisites

- Docker and Docker Compose
- Node.js (v18+) and pnpm (for local development)
- PostgreSQL and Redis (for local development)

## Running with Docker (Recommended)

Run the full backend stack (API + PostgreSQL + Redis + PgAdmin) with one command.

### One Command

```bash
docker compose up --build
```

### Service URLs

- Backend API: http://localhost:4975/api/v1
- Swagger Docs: http://localhost:4975/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- PgAdmin: http://localhost:5050

### Stop and Clean

```bash
docker compose down -v
```

## Running Locally

If you prefer to run the application locally without Docker:

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up the database:**
   - Ensure PostgreSQL and Redis are running locally.
   - Update the database connection in `src/configs/request.config.ts` if needed.
   - Run migrations:
     ```bash
     pnpm run db:migrate
     ```
   - Seed the database:
     ```bash
     pnpm run db:seed
     ```

3. **Start the development server:**
   ```bash
   pnpm run start:dev
   ```

The API will be available at http://localhost:4975 (default NestJS port).

## Demo Credentials

The application comes with pre-seeded demo users for testing:

### Admin User

- **Email:** admin@example.com
- **Password:** 123456
- **Role:** ADMIN | SYSTEM_ADMIN

### Regular User

- **Email:** user@example.com
- **Password:** 123456
- **Role:** USER

Use these credentials to log in via the API endpoints or Swagger documentation.

## API Documentation

- Swagger UI: http://localhost:4975/api/docs (when running with Docker)
- Base URL: http://localhost:4975/api/v1 (when running with Docker)

## AI Usage

I've used AI (GitHub Copilot) by slicing down the requirements and other processes. This helped in breaking down complex tasks into manageable components, generating boilerplate code, and accelerating development while ensuring best practices were followed. The `.agents` folder contains AI-generated agent configurations and workflows, while the `.requirements` folder holds detailed requirement specifications used for AI-assisted development.
