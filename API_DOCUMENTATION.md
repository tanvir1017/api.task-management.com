# Task Management API Documentation

## Table of Contents

1. [Health & Info Endpoints](#health-info-endpoints)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Task Endpoints](#task-endpoints)
4. [Data Models](#data-models)
5. [Response Format](#response-format)

---

## Health & Info Endpoints

### Get Health Status

**Endpoint:** `GET /health`

- **Authentication Required:** No
- **Roles Required:** None
- **Request Body:** None

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-04-08T12:00:00.000Z",
  "message": "Application is healthy"
}
```

**Status Code:** 200 OK

---

### Get API Information

**Endpoint:** `GET /`

- **Authentication Required:** No
- **Roles Required:** None
- **Request Body:** None

**Response:**

```json
{
  "name": "Task Management API",
  "version": "1.0.0",
  "description": "RESTful API for task management system",
  "environment": "development"
}
```

**Status Code:** 200 OK

---

## Authentication Endpoints

### User Registration

**Endpoint:** `POST /auth/register`

- **Authentication Required:** No
- **Roles Required:** None

**Request Body:**

```json
{
  "email": "new.user@example.com",
  "password": "StrongPass123!",
  "fullName": "New User",
  "username": "newuser"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address (must be unique) |
| `password` | string | Yes | Password (minimum 6 characters) |
| `fullName` | string | No | Full name of the user |
| `username` | string | No | Username (must be unique) |

**Response:**

```json
{
  "message": "User registered successfully",
  "redirectTo": "/login"
}
```

**Status Code:** 201 Created

**Error Responses:**

- `400 Bad Request` - Invalid email format, password too short, or user already exists
- `500 Internal Server Error` - Server error

---

### User Login

**Endpoint:** `POST /auth/login`

- **Authentication Required:** No
- **Roles Required:** None

**Request Body:**

```json
{
  "email": "new.user@example.com",
  "password": "StrongPass123!"
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `password` | string | Yes | User password |

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Invalid email or password
- `400 Bad Request` - Invalid request format
- `500 Internal Server Error` - Server error

---

### User Logout

**Endpoint:** `POST /auth/logout`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** Any authenticated user
- **Request Body:** None

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Server error

---

### Get All Users (Admin Only)

**Endpoint:** `GET /auth/users`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** ADMIN, SYSTEM_ADMIN
- **Request Body:** None

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "fullName": "Admin User",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-04-08T10:00:00.000Z",
    "updatedAt": "2026-04-08T10:00:00.000Z"
  },
  {
    "id": 2,
    "email": "user@example.com",
    "username": "user",
    "fullName": "Regular User",
    "role": "USER",
    "isActive": true,
    "createdAt": "2026-04-08T11:00:00.000Z",
    "updatedAt": "2026-04-08T11:00:00.000Z"
  }
]
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | User ID |
| `email` | string | User email |
| `username` | string | User username |
| `fullName` | string \| null | User full name |
| `role` | enum | User role (USER, ADMIN, SYSTEM_ADMIN) |
| `isActive` | boolean | Account active status |
| `createdAt` | datetime | Account creation timestamp |
| `updatedAt` | datetime | Last update timestamp |

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

## Task Endpoints

### Create Task (Admin Only)

**Endpoint:** `POST /tasks`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** ADMIN, SYSTEM_ADMIN

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Prepare sprint report",
  "description": "Gather metrics and prepare the final sprint summary",
  "assignedToId": 2
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title (minimum 2 characters) |
| `description` | string | No | Task description |
| `assignedToId` | number | Yes | ID of the user to assign task to |

**Response:**

```json
{
  "id": 1,
  "title": "Prepare sprint report",
  "description": "Gather metrics and prepare the final sprint summary",
  "status": "PENDING",
  "priority": 0,
  "creatorId": 1,
  "assigneeId": 2,
  "createdAt": "2026-04-08T12:00:00.000Z",
  "updatedAt": "2026-04-08T12:00:00.000Z"
}
```

**Status Code:** 201 Created

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

---

### Get All Tasks (Admin Only)

**Endpoint:** `GET /tasks`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** ADMIN, SYSTEM_ADMIN
- **Request Body:** None

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Prepare sprint report",
    "description": "Gather metrics and prepare the final sprint summary",
    "status": "PENDING",
    "priority": 0,
    "creatorId": 1,
    "assigneeId": 2,
    "createdAt": "2026-04-08T12:00:00.000Z",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Code review",
    "description": "Review pull requests from the team",
    "status": "IN_PROGRESS",
    "priority": 1,
    "creatorId": 1,
    "assigneeId": 3,
    "createdAt": "2026-04-07T14:30:00.000Z",
    "updatedAt": "2026-04-08T09:15:00.000Z"
  }
]
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### Update Task (Admin Only)

**Endpoint:** `PATCH /tasks/:id`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** ADMIN, SYSTEM_ADMIN

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Task ID |

**Request Body:**

```json
{
  "title": "Prepare sprint report - updated",
  "description": "Updated scope and fixed sprint metrics section",
  "assignedToId": 3
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Updated task title (minimum 2 characters) |
| `description` | string | No | Updated task description |
| `assignedToId` | number | No | ID of the user to reassign task to |

**Response:**

```json
{
  "id": 1,
  "title": "Prepare sprint report - updated",
  "description": "Updated scope and fixed sprint metrics section",
  "status": "PENDING",
  "priority": 0,
  "creatorId": 1,
  "assigneeId": 3,
  "createdAt": "2026-04-08T12:00:00.000Z",
  "updatedAt": "2026-04-08T13:30:00.000Z"
}
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Task not found
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

---

### Delete Task (Admin Only)

**Endpoint:** `DELETE /tasks/:id`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** ADMIN, SYSTEM_ADMIN
- **Request Body:** None

**Headers:**

```
Authorization: Bearer <access_token>
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Task ID |

**Response:**

```json
{
  "message": "Task deleted successfully"
}
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Task not found
- `500 Internal Server Error` - Server error

---

### Get My Assigned Tasks (User Only)

**Endpoint:** `GET /tasks/my`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** USER
- **Request Body:** None

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Prepare sprint report",
    "description": "Gather metrics and prepare the final sprint summary",
    "status": "PENDING",
    "priority": 0,
    "creatorId": 1,
    "assigneeId": 2,
    "createdAt": "2026-04-08T12:00:00.000Z",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  },
  {
    "id": 3,
    "title": "Fix login bug",
    "description": "Address the authentication issue in the login flow",
    "status": "IN_PROGRESS",
    "priority": 2,
    "creatorId": 1,
    "assigneeId": 2,
    "createdAt": "2026-04-06T10:00:00.000Z",
    "updatedAt": "2026-04-08T11:00:00.000Z"
  }
]
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions (not a USER role)
- `500 Internal Server Error` - Server error

---

### Get My Tasks with Filters (User Only)

**Endpoint:** `GET /tasks/my-task`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** USER

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in task title or description |
| `status` | enum | No | Filter by task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED) |

**Example URL:**

```
GET /tasks/my-task?search=report&status=PENDING
```

**Response:**

```json
[
  {
    "id": 1,
    "title": "Prepare sprint report",
    "description": "Gather metrics and prepare the final sprint summary",
    "status": "PENDING",
    "priority": 0,
    "creatorId": 1,
    "assigneeId": 2,
    "createdAt": "2026-04-08T12:00:00.000Z",
    "updatedAt": "2026-04-08T12:00:00.000Z"
  }
]
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions (not a USER role)
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server error

---

### Update My Task Status (User Only)

**Endpoint:** `PATCH /tasks/:id/status`

- **Authentication Required:** Yes (Bearer Token)
- **Roles Required:** USER

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Task ID |

**Request Body:**

```json
{
  "status": "IN_PROGRESS"
}
```

**Request Parameters:**
| Field | Type | Required | Allowed Values | Description |
|-------|------|----------|----------------|-------------|
| `status` | enum | Yes | PENDING, IN_PROGRESS, COMPLETED, CANCELLED | New task status |

**Response:**

```json
{
  "id": 1,
  "title": "Prepare sprint report",
  "description": "Gather metrics and prepare the final sprint summary",
  "status": "IN_PROGRESS",
  "priority": 0,
  "creatorId": 1,
  "assigneeId": 2,
  "createdAt": "2026-04-08T12:00:00.000Z",
  "updatedAt": "2026-04-08T13:45:00.000Z"
}
```

**Status Code:** 200 OK

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions (not a USER role or not the task assignee)
- `404 Not Found` - Task not found
- `400 Bad Request` - Invalid status value
- `500 Internal Server Error` - Server error

---

## Data Models

### User Model

```typescript
{
  id: number; // Unique identifier
  email: string; // Unique email address
  username: string; // Unique username
  password: string; // Hashed password
  fullName: string | null; // Full name of the user
  role: UserRole; // User role (USER, ADMIN, SYSTEM_ADMIN)
  isActive: boolean; // Account active status
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Task Model

```typescript
{
  id: number; // Unique identifier
  title: string; // Task title
  description: string | null; // Task description
  status: TaskStatus; // Task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  priority: number; // Task priority level
  creatorId: number; // ID of the user who created the task
  assigneeId: number | null; // ID of the user assigned to the task
  createdAt: Date; // Task creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### AuditLog Model

```typescript
{
  id: number; // Unique identifier
  actorId: number; // ID of the user performing the action
  actionType: AuditActionType; // Type of action (CREATE_TASK, UPDATE_TASK, DELETE_TASK, UPDATE_STATUS, ASSIGN_TASK)
  targetEntity: number; // ID of the entity being acted upon (Task ID)
  payload: Json; // Contains before/after states
  createdAt: Date; // Timestamp of the action
}
```

---

## Enums

### UserRole

```typescript
enum UserRole {
  USER          // Regular user
  ADMIN         // Administrator
  SYSTEM_ADMIN  // System administrator
}
```

### TaskStatus

```typescript
enum TaskStatus {
  PENDING       // Task is pending
  IN_PROGRESS   // Task is in progress
  COMPLETED     // Task is completed
  CANCELLED     // Task is cancelled
}
```

### AuditActionType

```typescript
enum AuditActionType {
  CREATE_TASK   // Task creation
  UPDATE_TASK   // Task update
  DELETE_TASK   // Task deletion
  UPDATE_STATUS // Status change
  ASSIGN_TASK   // Task assignment
}
```

---

## Response Format

All API responses follow a consistent format (wrapped by the response interceptor):

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "data": null
}
```

### Response Wrapper Interface

```typescript
interface ApiResponse<T> {
  success: boolean; // Whether the request was successful
  statusCode: number; // HTTP status code
  message: string; // Response message
  data: T | null; // Response data (can be null on error)
}
```

---

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Acquisition

1. Call the `/auth/register` endpoint to create a new account
2. Call the `/auth/login` endpoint with email and password
3. Use the returned `accessToken` for subsequent authenticated requests

### Token Refresh

Currently, the API does not support token refresh. Users must re-login to get a new token when the current one expires.

---

## Rate Limiting & Throttling

No explicit rate limiting is implemented in the current API version.

---

## CORS & Content-Type

- **Content-Type:** All requests should use `application/json`
- **CORS:** Configure according to your deployment environment
- **Headers:** Include `Authorization: Bearer <token>` for protected endpoints

---

## Error Handling

The API follows standard HTTP status codes:

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| `200`       | OK - Request successful                          |
| `201`       | Created - Resource created successfully          |
| `400`       | Bad Request - Invalid request parameters         |
| `401`       | Unauthorized - Missing or invalid authentication |
| `403`       | Forbidden - Insufficient permissions             |
| `404`       | Not Found - Resource not found                   |
| `500`       | Internal Server Error - Server-side error        |

---

**API Version:** 1.0.0  
**Last Updated:** 2026-04-08  
**Environment:** Development
