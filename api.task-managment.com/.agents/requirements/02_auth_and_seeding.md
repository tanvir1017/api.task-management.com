# Task: Authentication and Seed Data Setup

## Goal

Implement JWT authentication and populate the database with the required Admin and User accounts.

## Requirements

1. **Seeding (Crucial)**:
   - Create a seed script (or use Prisma Seed) to create two users:
     - [cite_start]**Admin**: Email `admin@example.com`, Password `password123`, Role `ADMIN`[cite: 18].
     - [cite_start]**Normal User**: Email `user@example.com`, Password `password123`, Role `USER`[cite: 19].
   - [cite_start]Use `bcrypt` to hash these passwords before saving[cite: 79].

2. **Auth Module**:
   - [cite_start]Implement a `/auth/login` endpoint that validates credentials[cite: 16].
   - [cite_start]Return a JWT token containing the User ID and Role[cite: 6].

3. **Guards & Decorators**:
   - Create a `@Public()` decorator to skip auth on the login route.
   - Create a `JwtAuthGuard` to protect all other routes by default.
   - [cite_start]Create a `RolesGuard` that checks the user's role against a `@Roles()` decorator[cite: 6].

## Action Items for Copilot:

1. Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, and `bcrypt`.
2. Generate an `AuthModule`, `AuthService`, and `AuthController`.
3. Implement the login logic and JWT strategy.
4. [cite_start]Create the Prisma seed script to ensure the predefined users exist[cite: 17].
5. Create a `Roles` decorator and a `RolesGuard`.
