# Task: Frontend Setup & Login Page Design

## Goal

Initialize the Next.js project and create a login page that strictly follows the brand guidelines.

## Brand Configuration (Tailwind/CSS)

- **Primary Color:** #3b82f6 (Buttons, active states)
- **Background:** #ffffff
- **Typography:** Sans-serif: "Inter"
- **Radius:** 0.375rem (For inputs and buttons)
- **Shadow:** 0px 1px 2px 0px (For cards and containers)

## Requirements

1. **Login Page**:
   - Centered card layout.
   - [cite_start]Fields: Email, Password. [cite: 65, 68]
   - [cite_start]Button: "Login" (Primary Blue #3b82f6). [cite: 63]
   - Implement simple client-side validation (email format, password length).
2. **Auth Integration**:
   - [cite_start]Connect to the `/auth/login` backend endpoint. [cite: 16]
   - On success, store the JWT in a cookie or secure localStorage.
   - [cite_start]Redirect users based on role: `/admin/dashboard` or `/user/dashboard`.

## Action Items for Copilot:

1. Setup Tailwind CSS with the provided color palette and fonts.
2. Create a high-fidelity Login component.
3. Implement the `useAuth` hook or context to handle the login state.
