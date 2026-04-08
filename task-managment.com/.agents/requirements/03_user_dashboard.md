# Task: User Dashboard (Assigned Tasks)

## Goal

[cite_start]Create a simplified dashboard for regular users to view and update their tasks. [cite: 14, 60]

## Requirements

1. **My Tasks List**:
   - [cite_start]Display only tasks where `assignedToId` matches the logged-in user. [cite: 14, 60]
   - [cite_start]Show: Title and a Status Dropdown. [cite: 61, 62]
2. **Status Update**:
   - [cite_start]Users can change status between: PENDING, PROCESSING, DONE. [cite: 15, 25]
   - Changing the status must trigger a `PATCH` request to the backend.

## Action Items for Copilot:

1. Build the User dashboard view.
2. [cite_start]Implement a dropdown or toggle for the Status column. [cite: 62]
3. Ensure the UI updates immediately upon a successful status change.
