# Task 4: Audit Logging System (Critical Feature)

## Goal

Implement a centralized audit logging system to track all critical actions in the application without polluting core business logic.

---

## Requirements

### Actions to Log

The system must log the following events:

- Task creation
- Task update
- Task deletion
- Task status changes
- Task assignment changes

---

## Audit Log Data Structure

Each log entry must include:

- `actorId`: ID of the user who performed the action
- `actionType`: String (e.g., CREATE_TASK, UPDATE_TASK, DELETE_TASK, UPDATE_STATUS, ASSIGN_TASK)
- `targetEntity`: Identifier of the affected entity (e.g., Task ID)
- `payload`: JSON object containing relevant data changes
  - Must include `before` and `after` states where applicable
- `createdAt`: Timestamp of the action

---

## Architecture Guidelines

- Create a dedicated `AuditModule`
- Implement an `AuditService` responsible for log creation
- Do NOT mix audit logging logic directly inside controllers
- Keep audit logic separate from task business logic

---

## Logging Strategy

### Recommended Approach (Service-Level Integration)

- Call `AuditService` methods from within `TaskService`
- Capture:
  - Actor from JWT (request context)
  - Previous state (before update)
  - New state (after update)

---

### Alternative (Advanced - Optional)

- Use NestJS Interceptors to automatically log actions
- This approach is more scalable but not required for this task

---

## Payload Design Example

```json
{
  "before": {
    "status": "PENDING",
    "assignedToId": 2
  },
  "after": {
    "status": "DONE",
    "assignedToId": 3
  }
}
```
