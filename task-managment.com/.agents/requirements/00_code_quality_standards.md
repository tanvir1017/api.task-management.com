# Global Task: Code Quality & Architectural Standards

## Goal

Ensure all generated NestJS and Next.js code is modular, maintainable, and follows industry best practices for a professional technical assessment.

## Backend (NestJS) Standards

1. **Modular Architecture**:
   - [cite_start]Every feature must have its own `.module.ts`, `.controller.ts`, and `.service.ts`.
   - Use Dependency Injection; never instantiate classes manually with `new`.
2. **Data Transfer Objects (DTOs)**:
   - Use `class-validator` and `class-transformer` for all input validation.
   - Every POST/PATCH endpoint must have a dedicated DTO file.
3. **Type Safety**:
   - Strict TypeScript usage. Avoid `any` at all costs.
   - Leverage Prisma-generated types for database interactions.
4. **Consistency**:
   - Use a Global Response Interceptor to wrap all outputs in a standard format: `{ success: boolean, data: T, message: string }`.
   - Use Global Exception Filters for uniform error handling.

## Frontend (Next.js) Standards

1. **Component Pattern**:
   - Use a `components/` directory for reusable UI (Buttons, Inputs, Modals).
   - Use a `features/` or `modules/` directory for complex logic (TaskTable, LoginForm).
2. **State Management**:
   - Use React Context or a lightweight hook-based approach for Auth state.
3. **Styling**:
   - Strictly follow the provided Brand Guidelines (Inter font, Primary Blue #3b82f6).
   - Use Tailwind CSS for all styling to keep the bundle clean.
4. **User Experience**:
   - Implement loading states (skeletons or spinners) and "Toast" notifications for success/error actions (e.g., "Task Created successfully").

## Action Items for Copilot:

- Adhere to these standards for every subsequent request.
- If a proposed solution violates these standards (e.g., putting logic in a controller), refactor it into a service automatically.
