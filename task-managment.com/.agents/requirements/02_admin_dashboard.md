# Task: Admin Dashboard & Task CRUD

## Goal

[cite_start]Build the Admin view to manage tasks and view audit logs. [cite: 8, 41]

## UI Components

1. **Sidebar**:
   - Background: #f9fafb (Sidebar Muted).
   - [cite_start]Links: "Dashboard", "Audit Log". [cite: 41, 42]
2. **Task Table**:
   - [cite_start]Columns: Title, Assignee, Status, Actions (Edit/Delete). [cite: 43, 47]
   - [cite_start]"Create Task" Button: Opens a modal. [cite: 44]
3. **Audit Log View**:
   - [cite_start]A table showing: Actor, Action, Target, and Timestamp. [cite: 33, 34, 35, 36]

## Requirements

- Use the `/tasks` endpoints (GET, POST, PATCH, DELETE).
- [cite_start]Only users with the `ADMIN` role should be able to access these routes. [cite: 7]

## Action Items for Copilot:

1. Create a Layout component with the Sidebar.
2. [cite_start]Build the Task List view with status badges (Blue for Processing, Gray for Pending, Green for Done). [cite: 25, 46]
3. Implement the "Create Task" modal.
