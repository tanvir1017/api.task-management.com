# Task: NestJS + Prisma + PostgreSQL Initial Setup

## Goal

Initialize a NestJS backend and define the database schema using Prisma ORM.

## Architecture Guidelines

- Use NestJS modular structure.
- [cite_start]Use Prisma for PostgreSQL interaction.
- [cite_start]Implement Enums for Status and Roles to ensure data integrity. [cite: 6, 25]

## Database Schema Requirements

Create a `schema.prisma` file with the following models:

1. **User Model**:
   - `id`: Int/UUID (Primary Key)
   - [cite_start]`email`: String (Unique) [cite: 65]
   - `password`: String
   - [cite_start]`role`: Enum (ADMIN, USER) [cite: 7, 11]
   - `tasks`: Relation to Task model
   - `logs`: Relation to AuditLog model

2. [cite_start]**Task Model**: [cite: 21]
   - `id`: Int/UUID (Primary Key)
   - [cite_start]`title`: String [cite: 22]
   - [cite_start]`description`: String [cite: 23]
   - [cite_start]`status`: Enum (PENDING, PROCESSING, DONE) [cite: 25]
   - `authorId`: Int (Relation to User - the Admin who created it)
   - [cite_start]`assignedToId`: Int (Relation to User - the assignee) [cite: 26]
   - [cite_start]`createdAt`: DateTime (Default now) [cite: 27]
   - [cite_start]`updatedAt`: DateTime (Updated at) [cite: 27]

3. [cite_start]**AuditLog Model**: [cite: 28, 33]
   - `id`: Int/UUID (Primary Key)
   - [cite_start]`actorId`: Int (Relation to User who performed the action) [cite: 34]
   - [cite_start]`actionType`: String (e.g., 'CREATE_TASK', 'UPDATE_STATUS', 'DELETE_TASK') [cite: 35]
   - [cite_start]`targetEntity`: String (Task ID or name) [cite: 36]
   - [cite_start]`payload`: JSON (To store 'before' and 'after' states) [cite: 37]
   - `createdAt`: DateTime (Default now)

## Action Items for Copilot:

1. Generate the NestJS project structure.
2. Install `@prisma/client`, `prisma`, and `class-validator`.
3. Generate the Prisma schema as defined above.
4. Create a Prisma service in NestJS to handle DB connections.
