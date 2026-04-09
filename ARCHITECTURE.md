# Task Management API - Fresh Start

**Clean, Scalable NestJS Backend Architecture**

## Project Structure

```
src/
├── main/                     # Main application module
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
├── common/                   # Shared utilities and components
│   ├── decorators/          # Custom decorators
│   ├── filters/             # Global exception filters
│   ├── guards/              # Authentication & authorization guards
│   ├── interceptors/        # Request/response interceptors
│   ├── middlewares/         # Custom middlewares
│   ├── pipes/               # Validation & transformation pipes
│   └── utils/               # Helper utilities
├── modules/                  # Feature modules
│   ├── auth/               # Authentication module (TODO)
│   ├── users/              # User management module (TODO)
│   └── tasks/              # Task management module (TODO)
├── config/                   # Application configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── ...
└── main.ts                  # Application bootstrap

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migrations

docker-compose.yml           # Docker services (PostgreSQL, Redis)
.env                         # Environment variables
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Configure your `.env`:

```env
DATABASE_URL="postgresql://taskmanager:taskmanager123@localhost:5432/task_management?schema=public"
APP_HTTP_PORT=3000
APP_ENV=development
CORS_ALLOWED_ORIGIN=http://localhost:3001
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run Application

```bash
# Development
pnpm run start:dev

# Production
pnpm run build
pnpm run start
```

## API Endpoints

- **Health Check**: `GET /api/v1/health`
- **API Info**: `GET /api/v1/`
- **Swagger Docs**: `http://localhost:3000/api/docs`

## Architecture Principles

✅ **Modular Design** - Each feature is a self-contained module
✅ **Separation of Concerns** - Controllers, services, repositories
✅ **DRY Principle** - Reusable utilities in common folder
✅ **Type Safety** - Full TypeScript support
✅ **Scalability** - Easy to add new features

## Next Steps

1. Create Auth Module (JWT authentication)
2. Create Users Module (CRUD operations)
3. Create Tasks Module (Task management)
4. Add middleware for logging and error handling
5. Add custom guards for role-based access
6. Setup comprehensive error handling
7. Add database transactions
8. Implement caching with Redis
9. Setup background jobs with Bull

---

**Created**: April 7, 2026
**Version**: 1.0.0
