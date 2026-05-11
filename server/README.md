# Task Manager API Documentation

This document outlines the available REST API endpoints for the Task Manager application, detailing their required payloads, authentication, and responses.

## Base URL
All endpoints are relative to the `/api` route.

---

## Authentication
Most endpoints require authentication. 
Pass the JWT token in the `Authorization` header as a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints (`/api/auth`)

### 1. Sign Up
- **Method:** `POST /api/auth/signup`
- **Description:** Register a new user.
- **Request Body:**
  ```json
  {
    "name": "John Doe",       // required, min 2 characters
    "email": "john@test.com", // required, valid email
    "password": "password123" // required, min 6 characters
  }
  ```
- **Response (201):** Returns the `token` and `user` object.

### 2. Login
- **Method:** `POST /api/auth/login`
- **Description:** Authenticate an existing user.
- **Request Body:**
  ```json
  {
    "email": "john@test.com", // required
    "password": "password123" // required
  }
  ```
- **Response (200):** Returns the `token` and `user` object.

### 3. Get Current User
- **Method:** `GET /api/auth/me`
- **Auth:** Bearer Token required
- **Description:** Get the authenticated user's profile.
- **Response (200):** Returns the `user` object.

---

## Dashboard Endpoints (`/api/dashboard`)

### 1. Get Dashboard Stats
- **Method:** `GET /api/dashboard`
- **Auth:** Bearer Token required
- **Description:** Retrieve aggregate statistics for all projects the current user belongs to (task counts, overdue tasks, status/priority breakdown, and user workloads).
- **Response (200):** Returns a JSON object with aggregated dashboard stats.

---

## Project Endpoints (`/api/projects`)

*Note: All endpoints below require a Bearer Token.*

### 1. Get User Projects
- **Method:** `GET /api/projects`
- **Description:** Get a list of all projects the authenticated user is a member of.
- **Response (200):** Returns an array of `projects`.

### 2. Create Project
- **Method:** `POST /api/projects`
- **Description:** Create a new project. The creator is automatically assigned the `ADMIN` role.
- **Request Body:**
  ```json
  {
    "name": "New Project", // required, 1-100 chars
    "description": "..."   // optional, max 500 chars
  }
  ```
- **Response (201):** Returns the created `project` object.

### 3. Get Project Details
- **Method:** `GET /api/projects/:projectId`
- **Auth:** Requires the user to be a project member.
- **Description:** Get details of a specific project and a list of its members.
- **Response (200):** Returns `{ project, members }`.

### 4. Update Project
- **Method:** `PATCH /api/projects/:projectId`
- **Auth:** Requires `ADMIN` role in the project.
- **Request Body:** Any combination of `name` and `description`.
- **Response (200):** Returns the updated `project` object.

### 5. Delete Project
- **Method:** `DELETE /api/projects/:projectId`
- **Auth:** Requires `ADMIN` role in the project.
- **Response (200):** Returns `{ message: "Project deleted" }`.

---

## Project Members Endpoints (`/api/projects/:projectId/members`)

### 1. Add Member
- **Method:** `POST /api/projects/:projectId/members`
- **Auth:** Requires `ADMIN` role in the project.
- **Request Body:**
  ```json
  {
    "email": "user@test.com",
    "role": "MEMBER" // optional, "ADMIN" | "MEMBER", defaults to "MEMBER"
  }
  ```
- **Response (201):** Returns success message along with user details.

### 2. Remove Member
- **Method:** `DELETE /api/projects/:projectId/members/:userId`
- **Auth:** Requires `ADMIN` role in the project. Note: Admins cannot remove themselves.
- **Response (200):** Returns `{ message: "Member removed" }`.

---

## Task Endpoints (`/api/projects/:projectId/tasks`)

*Note: All endpoints below require the user to be a project member.*

### 1. Get Tasks
- **Method:** `GET /api/projects/:projectId/tasks`
- **Description:** Retrieve all tasks for a project.
- **Query Parameters (optional):** 
  - `status` (e.g., `TODO`, `IN_PROGRESS`, `DONE`)
  - `priority` (e.g., `LOW`, `MEDIUM`, `HIGH`)
  - `assignedTo` (UUID of a user)
- **Response (200):** Returns an array of tasks with assignee details.

### 2. Create Task
- **Method:** `POST /api/projects/:projectId/tasks`
- **Auth:** Requires `ADMIN` role in the project.
- **Request Body:**
  ```json
  {
    "title": "Fix bug",          // required, 1-200 chars
    "description": "...",        // optional, max 1000 chars
    "dueDate": "2024-12-31T23:59:59Z", // optional, ISO datetime
    "priority": "MEDIUM",        // optional, "LOW" | "MEDIUM" | "HIGH"
    "status": "TODO",            // optional, "TODO" | "IN_PROGRESS" | "DONE"
    "assignedTo": "uuid-here"    // optional user ID
  }
  ```
- **Response (201):** Returns the created `task` object.

### 3. Get Task Details
- **Method:** `GET /api/projects/:projectId/tasks/:taskId`
- **Response (200):** Returns the specific `task` and its `assignee`.

### 4. Update Task
- **Method:** `PATCH /api/projects/:projectId/tasks/:taskId`
- **Auth Roles & Behavior:**
  - **`ADMIN`:** Can update all fields (`title`, `description`, `dueDate`, `priority`, `status`, `assignedTo`).
  - **`MEMBER`:** Can **only** update the `status` field, and **only** for tasks directly assigned to them.
- **Request Body (Member example):**
  ```json
  {
    "status": "DONE"
  }
  ```
- **Response (200):** Returns the updated `task` object.

### 5. Delete Task
- **Method:** `DELETE /api/projects/:projectId/tasks/:taskId`
- **Auth:** Requires `ADMIN` role in the project.
- **Response (200):** Returns `{ message: "Task deleted" }`.
