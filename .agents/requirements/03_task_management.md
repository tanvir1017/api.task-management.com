# Task 3: Task Management Module (Core Business Logic)

## Goal

Implement the full task lifecycle with proper role-based access control (RBAC) and clean architectural separation using NestJS.

---

## Requirements

### 1. Admin Capabilities

- Create tasks
- Update tasks
- Delete tasks
- Assign tasks to users
- View all tasks

### 2. User Capabilities

- View only assigned tasks
- Update only task status (e.g., PENDING → PROCESSING → DONE)

---

## Architecture Guidelines

- Follow NestJS modular structure:
  - `TaskModule`
  - `TaskController`
  - `TaskService`
- Use Prisma for database interaction (no direct DB queries in controller)
- Keep business logic inside services only
- Use DTOs for validation and data transfer

---

## Authorization Rules

- Only users with `ADMIN` role can:
  - Create tasks
  - Update task details
  - Delete tasks
  - Assign tasks

- Users with `USER` role can:
  - View only their assigned tasks
  - Update only the `status` field of their assigned tasks

- Enforce access using:
  - `JwtAuthGuard` (authentication)
  - `RolesGuard` (authorization)
  - `@Roles()` decorator

---

## DTO Design

Create the following DTOs:

- `CreateTaskDto`
  - title
  - description
  - assignedToId

- `UpdateTaskDto`
  - title (optional)
  - description (optional)
  - assignedToId (optional)

- `UpdateTaskStatusDto`
  - status (Enum: PENDING, PROCESSING, DONE)

Use `class-validator` for validation.

---

## API Endpoints

### Admin Routes

- `POST /tasks` → Create task
- `GET /tasks` → Get all tasks
- `PATCH /tasks/:id` → Update task
- `DELETE /tasks/:id` → Delete task

### User Routes

- `GET /tasks/my` → Get assigned tasks
- `PATCH /tasks/:id/status` → Update task status

---

## Data Handling Rules

- When creating a task:
  - `authorId` must be the logged-in Admin
- When assigning a task:
  - Validate that the assigned user exists
- When updating:
  - Ensure role-based restrictions are enforced
- When fetching:
  - Admin → all tasks
  - User → only assigned tasks

---

## Error Handling

- Throw appropriate HTTP exceptions:
  - `403 Forbidden` for unauthorized actions
  - `404 Not Found` if task/user does not exist
- Validate ownership before allowing updates by users

---

## Action Items for Copilot

1. Generate `TaskModule`, `TaskService`, and `TaskController`
2. Implement CRUD operations for tasks
3. Add DTO validation using `class-validator`
4. Integrate Prisma queries inside the service layer
5. Apply `JwtAuthGuard` to all routes
6. Apply `RolesGuard` and `@Roles()` where necessary
7. Implement filtering logic:
   - Admin → fetch all tasks
   - User → fetch only assigned tasks
