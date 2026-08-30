# ClassSync MVP Technical Specification

**Version:** 1.0 MVP  
**Date:** 2026-08-28  
**Status:** Proposed  
**Audience:** Product, mobile, backend, QA, and infrastructure teams

## Executive summary

ClassSync is a two-mode EdTech platform designed to reduce coordination overhead for both students and teachers. The core product loop is simple: when a teacher creates or updates learning work, the system transforms it into a canonical assignment, fan-outs the event to all enrolled students, and surfaces the updated deadline in a unified schedule. Students gain clarity and habit; teachers gain time and leverage through AI-augmented class operations.

This specification focuses on the MVP that proves the product loop works end-to-end:

- Student Mode: unified schedule, deadline visibility, OCR from images, real-time class membership
- Teacher Mode: class creation, assignment publishing, AI lesson/quiz generation, student micro-profile management
- Shared platform: Firebase Auth, Firestore, FCM, backend validation, permission checks, modular service structure

The technical goal is not to build a generic LMS. The goal is to create a reliable workflow engine for tutoring and small-class education that can later expand into center-level operations, cohort analytics, and parent notification workflows.

## 1. Product Summary

ClassSync is a two-mode EdTech application:

- **Student Mode:** one place for classes, schedules, homework, and deadlines.
- **Teacher Mode:** class administration, attendance-ready student context, and AI-assisted lesson/quiz preparation.

The MVP optimizes for one reliable loop: a teacher publishes learning work once, and every enrolled student receives the same schedule/deadline and notification without manual re-entry.

### 1.1 Goals and Success Metrics

| Goal | MVP measure |
| --- | --- |
| Reduce missed homework | At least 90% of assignments appear in enrolled students' unified schedules within 10 seconds |
| Reduce teacher administration | A teacher can create a class and assignment in under 60 seconds |
| Make joining frictionless | A student joins with a six-character code and sees the class immediately |
| Make AI useful, not decorative | Quiz/lesson generation returns valid structured content within 30 seconds for normal prompts |
| Make OCR actionable | A clear homework photo produces editable extracted text and a suggested deadline |

### 1.2 Assumptions and Constraints

- Firebase Authentication is the identity provider.
- Firebase Admin SDK is used only by the backend; clients never hold service-account credentials.
- Firestore is the source of truth for MVP data and real-time listeners.
- FCM handles device alerts; notification delivery is best-effort and data sync remains authoritative.
- AI and OCR providers are accessed through backend adapters so Gemini/Cloud Vision can be replaced without changing mobile contracts.
- All timestamps are stored as UTC. Clients render using the user's timezone.

## 2. MVP Feature Scope

### 2.1 In Scope

#### Student Mode

- Sign in with Firebase Auth.
- View enrolled classes and class schedule rules.
- Join a class using a six-character class code.
- View a unified schedule and pending assignment deadlines.
- Receive FCM alerts when a teacher creates or updates an assignment.
- Photograph or upload an assignment image, run OCR, edit extracted fields, and save a personal deadline.
- Register and refresh FCM device tokens.

#### Teacher Mode

- Sign in with Firebase Auth.
- Create a class with name, subject, and recurring schedule rules.
- Share a unique six-character join code.
- View enrolled students.
- Create, edit, and delete homework with description, due date, and attachment URLs.
- Automatically sync assignments to all enrolled students and send FCM alerts.
- Add or update a class-scoped Student Micro-Profile note and tag flags.
- Generate a 10-question quiz or lesson outline from a topic and optional document.
- Review, edit, and save an AI-generated asset.

#### Platform and Quality

- Role-based authorization (`STUDENT`, `TEACHER`) on every protected endpoint.
- Request validation, consistent JSON errors, audit timestamps, and ownership checks.
- Firestore indexes and security rules for the collections below.
- Basic observability: request ID, structured server logs, provider latency, and failed notification count.

### 2.2 Out of Scope for MVP, Planned for v1.0

| Area | Out of scope for MVP | v1.0 direction |
| --- | --- | --- |
| Attendance | Live attendance, late/present analytics | Teacher attendance sessions and reports |
| Messaging | In-app chat, group discussion, parent chat | Class announcements and moderated messaging |
| Notifications | SMS, Zalo ZNS, email campaigns | Parent notification channels and preferences |
| AI | Automated grading, answer-key validation, tutoring chat | Rubric grading and guided study assistant |
| OCR | Handwriting recognition, multi-page batch workflows | Better handwriting and document classification |
| Calendar | External Google/Apple calendar two-way sync | Calendar provider integrations |
| Billing | Payments and subscription enforcement | Teacher Pro, center plans, quotas |
| Administration | Multi-teacher centers, admin dashboard | Organization and multi-tenant management |
| Analytics | Learning analytics and cohort dashboards | Progress, retention, and intervention analytics |

### 2.3 Core User Flows

#### Flow A: Teacher Creates Class, Student Joins

1. Teacher authenticates and opens Teacher Mode.
2. Client sends `POST /api/v1/classes` with class name, subject, and schedule rules.
3. Backend verifies `TEACHER`, creates a collision-checked six-character uppercase `class_code`, and returns the class.
4. Teacher shares the code out of band or through the UI.
5. Student sends `POST /api/v1/classes/join` with the code.
6. Backend verifies `STUDENT`, resolves the code, and creates an idempotent enrollment.
7. Student receives the class in the class list and starts a Firestore listener for class changes.

#### Flow B: Teacher Assigns Homework and Syncs Students

1. Teacher submits title, description, due date, and attachments.
2. Backend verifies that the teacher owns the class and validates the payload.
3. Backend writes the canonical assignment.
4. Backend creates or upserts a schedule item for every active enrollment in a Firestore batch.
5. Backend sends an FCM data/notification message to registered student tokens in batches of at most 500.
6. Clients reconcile the notification with Firestore; a missed push never means a missed assignment.
7. Teacher receives the assignment and `syncJobId` immediately after the canonical write and outbox enqueue; the worker completes fan-out asynchronously.

#### Flow C: Student Uses OCR to Create a Deadline

1. Student selects or photographs one assignment image.
2. Client sends multipart image data or a base64 payload to `POST /api/v1/ocr/parse-assignment`.
3. Backend checks file type/size, stores the image temporarily or in approved object storage, and calls the OCR adapter.
4. OCR returns extracted text, confidence, suggested title, and a parsed due date when one is detectable.
5. Client shows an editable confirmation form. No deadline is created silently from low-confidence OCR.
6. Student confirms; backend creates a personal assignment/deadline with `source=OCR`.

#### Flow D: Teacher Generates a Quiz or Lesson Plan

1. Teacher submits a topic or document, grade level, language, and asset type.
2. Backend validates the input, applies the teacher's plan quota, and calls the configured AI adapter.
3. The adapter requests strict JSON schema output.
4. Backend validates the generated JSON, stores the prompt and result in `ai_generated_assets`, and returns the asset.
5. Teacher reviews and edits content before sharing or exporting it.
6. A timeout or invalid provider response returns a retryable error and does not create a misleading asset.

## 3. Database Schema Design

### 3.1 Storage Strategy

Firestore is the MVP operational store. The logical relational keys below make relationships explicit and allow a later PostgreSQL migration or reporting replica. Use stable document IDs and deterministic composite IDs for unique relationships.

- `users/{user_id}`
- `classes/{class_id}`
- `enrollments/{enrollment_id}` where `enrollment_id = {class_id}_{student_id}`
- `assignments/{assignment_id}`
- `student_micro_profiles/{profile_id}` where `profile_id = {class_id}_{student_id}`
- `ai_generated_assets/{asset_id}`
- `student_schedules/{student_id}/items/{assignment_id}` for denormalized read projection
- `sync_events/{event_id}` for audit/retry metadata

Firestore timestamps use `Timestamp`; API JSON uses ISO-8601 strings.

### 3.2 Entity Definitions

#### `users`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Firebase Auth UID; document ID |
| `email` | string | yes | Lowercase, unique in Auth |
| `name` | string | yes | 1-120 characters |
| `role` | enum | yes | `STUDENT` or `TEACHER` |
| `avatar_url` | string/null | no | HTTPS URL |
| `fcm_tokens` | string[] | yes | Deduplicated registration tokens; cap per user |
| `created_at` | timestamp | yes | Server timestamp |
| `updated_at` | timestamp | yes | Server timestamp |

#### `classes`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Document ID |
| `teacher_id` | string | yes | Reference to `users` |
| `class_name` | string | yes | 1-120 characters |
| `subject` | string | yes | 1-80 characters |
| `class_code` | string | yes | Exactly 6 uppercase alphanumeric characters; unique |
| `schedule_rules` | object[] | yes | See schedule rule below |
| `status` | enum | yes | `ACTIVE` or `ARCHIVED` |
| `created_at` | timestamp | yes | Server timestamp |
| `updated_at` | timestamp | yes | Server timestamp |

A `schedule_rules` item is `{ day_of_week: 0..6, start_time: "HH:mm", end_time: "HH:mm", timezone?: string, location?: string }`.

#### `enrollments`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | `{class_id}_{student_id}` |
| `class_id` | string | yes | Reference to `classes` |
| `student_id` | string | yes | Reference to `users` |
| `joined_at` | timestamp | yes | Server timestamp |
| `status` | enum | yes | `ACTIVE`, `LEFT`, or `REMOVED` |

#### `assignments`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Document ID |
| `class_id` | string | yes | Reference to `classes` |
| `teacher_id` | string | yes | Must own the class |
| `title` | string | yes | 1-200 characters |
| `description` | string | no | Max 10,000 characters |
| `due_date` | timestamp | yes | Must be a valid future/past ISO date as allowed by product policy |
| `attachments_urls` | string[] | no | HTTPS URLs; validate count and size separately |
| `created_at` | timestamp | yes | Server timestamp |
| `updated_at` | timestamp | yes | Server timestamp |
| `status` | enum | yes | `ACTIVE`, `COMPLETED`, or `CANCELLED` |

#### `student_micro_profiles`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | `{class_id}_{student_id}` |
| `class_id` | string | yes | Teacher must own class |
| `student_id` | string | yes | Student must be active in class |
| `teacher_notes` | string | yes | Class-scoped; max 5,000 characters |
| `tag_flags` | string[] | no | Controlled tags such as `WEAK_GEOMETRY`, `OFTEN_LATE` |
| `created_at` | timestamp | yes | Server timestamp |
| `updated_at` | timestamp | yes | Server timestamp |

#### `ai_generated_assets`

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `id` | string | yes | Document ID |
| `teacher_id` | string | yes | Requesting teacher |
| `type` | enum | yes | `QUIZ` or `LESSON_OUTLINE` |
| `prompt_input` | object | yes | Topic, grade level, language, source metadata |
| `generated_content` | object | yes | Validated structured JSON, not arbitrary client HTML |
| `model` | string | yes | Provider/model identifier |
| `status` | enum | yes | `COMPLETED` or `FAILED` |
| `created_at` | timestamp | yes | Server timestamp |

#### `student_schedules/{student_id}/items/{assignment_id}`

This is a denormalized projection for fast mobile reads. It contains `assignment_id`, class metadata, title, description, due date, attachments, source assignment version, and `synced_at`. The canonical assignment remains in `assignments`.

#### `sync_events`

Store `event_type`, `aggregate_id`, `class_id`, `student_count`, `notification_count`, `status`, `attempts`, `created_at`, and `last_error`. This supports operational reconciliation when FCM fails after a successful Firestore write.

### 3.3 Relationships

- One `user` with role `TEACHER` owns many `classes`.
- One `class` has many active `enrollments`; one student can join many classes.
- One `class` has many `assignments`.
- One active enrollment has at most one class-scoped `student_micro_profile`.
- One assignment is projected into every enrolled student's schedule subcollection.
- One teacher owns many `ai_generated_assets`.

### 3.4 Indexes and Constraints

Recommended Firestore indexes:

| Collection | Fields | Use |
| --- | --- | --- |
| `classes` | `teacher_id ASC`, `status ASC`, `updated_at DESC` | Teacher class list |
| `classes` | `class_code ASC` | Join-code lookup; enforce uniqueness in transaction/registry |
| `enrollments` | `student_id ASC`, `status ASC`, `joined_at DESC` | Student class list |
| `enrollments` | `class_id ASC`, `status ASC` | Assignment fan-out and roster |
| `assignments` | `class_id ASC`, `due_date ASC` | Class assignment list |
| `student_schedules/{student_id}/items` | `due_date ASC`, `status ASC` | Pending deadlines |
| `ai_generated_assets` | `teacher_id ASC`, `created_at DESC` | Teacher asset history |

Use a `class_code_registry/{class_code}` document or a transaction that reserves the code if strict uniqueness is required under concurrent class creation.

### 3.5 Security Rules Principles

- Clients may read/write only their own `users` profile fields allowed by policy.
- Only a teacher whose UID equals `classes.teacher_id` may mutate that class's assignments or profiles.
- A student may create an enrollment only for their own UID and may read only active enrollments containing their UID.
- Students may read their own schedule projection; clients cannot directly write schedule projections.
- AI assets are readable and editable only by their owning teacher unless explicitly shared.
- Service-account backend writes use Admin SDK and still enforce ownership in application services.

## 4. REST API Specification

### 4.1 Conventions

- Base URL: `/api/v1`
- The backend mounts these handlers under `/api/v1` by default and keeps `/api` as a compatibility alias for the original scaffold clients.
- Content type: `application/json`, except multipart OCR upload.
- Authentication: `Authorization: Bearer <Firebase ID token>`.
- Token custom claim: `role: "STUDENT" | "TEACHER"`.
- Pagination: `page_size` (default 20, max 100) and opaque `page_token` where lists can grow.
- Errors: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "request_id": "...", "details": [] } }`.
- Dates: ISO-8601 UTC strings.

### 4.2 Authentication and User Management

Firebase Auth owns sign-up, sign-in, password reset, and identity verification. The backend provides profile and token registration APIs.

| Method | Endpoint | Role | Request | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/users/me` | Any | none | Current `User` profile |
| `PATCH` | `/users/me` | Any | `name`, optional `avatar_url` | Updated profile |
| `PUT` | `/users/me/fcm-tokens` | Any | `{ token }` | `204 No Content` |
| `DELETE` | `/users/me/fcm-tokens` | Any | `{ token }` | `204 No Content` |

### 4.3 Classroom APIs

| Method | Endpoint | Role | Request | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/classes` | Teacher | `{ class_name, subject, schedule_rules[] }` | `201 Class` |
| `GET` | `/classes` | Any | pagination | `200 Class[]` relevant to user |
| `GET` | `/classes/{classId}` | Member | none | `200 Class` |
| `POST` | `/classes/join` | Student | `{ class_code }` | `201 Enrollment` |
| `GET` | `/classes/{classId}/students` | Owner teacher | pagination | `200 User[]` |
| `PATCH` | `/classes/{classId}` | Owner teacher | mutable class fields | `200 Class` |
| `POST` | `/classes/{classId}/archive` | Owner teacher | none | `200 Class` |

### 4.4 Assignment and Sync APIs

| Method | Endpoint | Role | Request | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/assignments` | Teacher | `{ class_id, title, description?, due_date, attachments_urls[] }` | `201 Assignment` |
| `GET` | `/classes/{classId}/assignments` | Class member | pagination/filter | `200 Assignment[]` |
| `PATCH` | `/assignments/{assignmentId}` | Owner teacher | mutable assignment fields | `200 Assignment` and sync status |
| `DELETE` | `/assignments/{assignmentId}` | Owner teacher | none | `204 No Content` and cancellation sync |
| `GET` | `/student/schedule` | Student | `from?`, `to?`, `status?` | `{ classes[], schedule_items[], next_page_token? }` |
| `GET` | `/student/schedule/stream` | Student | SSE/WebSocket token | Real-time schedule events |

`POST /assignments` and assignment updates must be idempotent when the client supplies an `Idempotency-Key`. The response may include `{ sync: { status, enrolled_count, projected_count, notification_count } }`.

### 4.5 AI APIs

#### `POST /api/v1/ai/generate-quiz`

Role: `TEACHER`.

Request:

```json
{
  "type": "QUIZ",
  "topic": "Quadratic equations",
  "document_text": "Optional extracted source text",
  "grade_level": "9",
  "language": "vi",
  "question_count": 10,
  "difficulty": "MIXED"
}
```

Response `200`:

```json
{
  "asset_id": "asset_123",
  "type": "QUIZ",
  "model": "gemini-2.x",
  "questions": [
    {
      "number": 1,
      "question": "...",
      "type": "MULTIPLE_CHOICE",
      "options": ["...", "...", "...", "..."],
      "correct_option": 2,
      "explanation": "...",
      "difficulty": "MEDIUM"
    }
  ],
  "created_at": "2026-08-28T10:00:00Z"
}
```

For `LESSON_OUTLINE`, use the same endpoint with `type=LESSON_OUTLINE`; return `objectives`, `sections`, `activities`, and `assessment` instead of `questions`.

#### `POST /api/v1/ai/generate-lesson`

Role: `TEACHER`. Same input contract with `type=LESSON_OUTLINE`; kept as a clear alias for mobile clients.

AI safeguards:

- Limit input length and document size.
- Never send Firebase tokens or unrelated student private notes to the model.
- Validate provider output against a JSON schema before storing or returning it.
- Apply per-user/plan rate limits and record provider latency/cost metadata.

### 4.6 OCR APIs

#### `POST /api/v1/ocr/parse-assignment`

Role: `STUDENT`.

Accepted input: `multipart/form-data` field `image` or JSON `{ "image_base64": "...", "mime_type": "image/jpeg" }`.

Response `200`:

```json
{
  "extracted_text": "Complete exercise 1 on page 42. Due Friday 20:00.",
  "confidence": 0.94,
  "suggested_title": "Exercise 1 page 42",
  "parsed_due_date": "2026-09-04T13:00:00Z",
  "warnings": [],
  "expires_at": "2026-08-28T10:15:00Z"
}
```

Constraints: accept JPEG/PNG/WebP, enforce a configurable size limit, scan uploads, and never trust client-provided MIME types alone. A low-confidence or ambiguous date returns `parsed_due_date: null` plus a warning for manual confirmation.

`POST /api/v1/ocr/assignments` can be added as the confirmation endpoint to persist the student's personal OCR-derived deadline:

```json
{
  "title": "Exercise 1 page 42",
  "description": "Complete exercise 1...",
  "due_date": "2026-09-04T13:00:00Z",
  "source": "OCR"
}
```

### 4.7 Micro-Profile APIs

| Method | Endpoint | Role | Request | Response |
| --- | --- | --- | --- | --- |
| `GET` | `/classes/{classId}/students/{studentId}/profile` | Owner teacher | none | `200 StudentMicroProfile` |
| `PUT` | `/classes/{classId}/students/{studentId}/profile` | Owner teacher | `{ teacher_notes, tag_flags[] }` | `200 StudentMicroProfile` |
| `POST` | `/teacher/students/{studentId}/notes` | Owner teacher | `{ class_id, teacher_notes }` | `200 StudentMicroProfile` |

Notes are private to authorized teachers of the class and are never included in student-facing payloads or AI prompts by default.

### 4.8 OpenAPI Core Snippet

```yaml
openapi: 3.0.3
info:
  title: ClassSync API
  version: 1.0.0
servers:
  - url: https://api.example.com/api/v1
security:
  - firebaseBearer: []
components:
  securitySchemes:
    firebaseBearer:
      type: http
      scheme: bearer
      bearerFormat: FirebaseIDToken
  schemas:
    Class:
      type: object
      required: [id, teacher_id, class_name, subject, class_code, schedule_rules]
      properties:
        id: { type: string }
        teacher_id: { type: string }
        class_name: { type: string, maxLength: 120 }
        subject: { type: string, maxLength: 80 }
        class_code: { type: string, pattern: '^[A-Z0-9]{6}$' }
        schedule_rules:
          type: array
          items: { $ref: '#/components/schemas/ScheduleRule' }
    ScheduleRule:
      type: object
      required: [day_of_week, start_time, end_time]
      properties:
        day_of_week: { type: integer, minimum: 0, maximum: 6 }
        start_time: { type: string, example: '18:00' }
        end_time: { type: string, example: '19:30' }
        timezone: { type: string, example: 'Asia/Ho_Chi_Minh' }
    Assignment:
      type: object
      required: [id, class_id, teacher_id, title, due_date, attachments_urls]
      properties:
        id: { type: string }
        class_id: { type: string }
        teacher_id: { type: string }
        title: { type: string, maxLength: 200 }
        description: { type: string }
        due_date: { type: string, format: date-time }
        attachments_urls:
          type: array
          items: { type: string, format: uri }
paths:
  /classes:
    post:
      summary: Create a class
      security: [{ firebaseBearer: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [class_name, subject]
              properties:
                class_name: { type: string }
                subject: { type: string }
                schedule_rules: { type: array, items: { $ref: '#/components/schemas/ScheduleRule' } }
      responses:
        '201': { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/Class' } } } }
        '400': { description: Invalid request }
        '401': { description: Missing or invalid Firebase token }
        '403': { description: Teacher role required }
  /classes/join:
    post:
      summary: Join a class by code
      security: [{ firebaseBearer: [] }]
      responses:
        '201': { description: Enrollment created }
        '404': { description: Class code not found }
        '409': { description: Already enrolled }
  /assignments:
    post:
      summary: Create and fan out an assignment
      security: [{ firebaseBearer: [] }]
      responses:
        '201': { description: Assignment created and sync queued/completed }
  /student/schedule:
    get:
      summary: Get unified student schedule
      security: [{ firebaseBearer: [] }]
      responses:
        '200': { description: Unified classes and deadlines }
  /ai/generate-quiz:
    post:
      summary: Generate a structured ten-question quiz
      security: [{ firebaseBearer: [] }]
      responses:
        '200': { description: Structured quiz asset }
  /ocr/parse-assignment:
    post:
      summary: Extract assignment text and due date from an image
      security: [{ firebaseBearer: [] }]
      responses:
        '200': { description: OCR result }
```

## 5. Real-Time Sync and Push Architecture

### 5.1 Source of Truth and Projection

Firestore canonical documents are authoritative. The per-student schedule subcollection is a denormalized projection designed for a single low-latency mobile query. The server, never the client, owns projection writes.

```mermaid
flowchart LR
  T[Teacher app] -->|Firebase ID token| API[ClassSync API]
  API --> C[(classes / assignments)]
  API --> E[(enrollments)]
  E --> B[Firestore batch]
  B --> S[(student_schedules/{studentId}/items)]
  API --> FCM[Firebase Cloud Messaging]
  FCM --> D1[Student device A]
  FCM --> D2[Student device B]
  S --> D1
  S --> D2
```

### 5.2 Assignment Create/Update Sequence

1. Authenticate the teacher and authorize class ownership.
2. Validate and normalize the assignment.
3. Write the canonical assignment with a version or `updated_at` value.
4. Query active enrollments for the class.
5. Batch upsert each student's schedule projection with the same assignment ID and version.
6. Commit the batch. If it fails, return an error and do not send push notifications.
7. Load active FCM tokens, remove duplicates, and send multicast messages in groups of 500.
8. Record send counts and invalid tokens in `sync_events`; prune invalid tokens.
9. Mobile clients process the notification and fetch/reconcile the projection. Firestore listeners cover foreground and missed-notification cases.

For large classes, the API uses the Firestore-backed outbox worker and returns `sync.status=PROCESSING`; the same idempotent projection worker retries failed batches. A production deployment can replace polling with Cloud Tasks/Pub/Sub without changing the job contract.

### 5.3 Conflict and Retry Rules

- Assignment IDs are stable; a retry upserts the same projection rather than creating duplicates.
- A projection with an older assignment version must not overwrite a newer version.
- Joining after an assignment was created is handled by a backfill job or by querying canonical class assignments when the student first opens the class.
- Push delivery is not the source of truth and has no impact on Firestore consistency.
- FCM token errors are isolated per token; one invalid token must not fail the entire multicast operation.

### 5.4 FCM Payload

Use a notification payload for visible background alerts and a data payload for deterministic client routing:

```json
{
  "notification": {
    "title": "New assignment in Algebra 9A",
    "body": "Complete quadratic equations by Friday 20:00"
  },
  "data": {
    "event_type": "ASSIGNMENT_UPSERTED",
    "assignment_id": "assignment_123",
    "class_id": "class_456",
    "version": "7",
    "deep_link": "classsync://classes/class_456/assignments/assignment_123"
  },
  "android": {
    "priority": "high",
    "notification": { "channel_id": "assignments" }
  },
  "apns": {
    "payload": { "aps": { "sound": "default", "content-available": 1 } }
  }
}
```

Event types for MVP: `ASSIGNMENT_UPSERTED`, `ASSIGNMENT_CANCELLED`, `CLASS_SCHEDULE_UPDATED`. Never include private teacher notes, full document contents, or credentials in FCM payloads.

## 6. Non-Functional Requirements

| Area | MVP requirement |
| --- | --- |
| Performance | P95 API response under 500 ms excluding AI/OCR provider calls; AI/OCR timeout 30 seconds |
| Availability | Graceful provider failures; canonical Firestore data remains usable when FCM is unavailable |
| Security | HTTPS, Firebase token verification, role/ownership checks, upload validation, rate limiting |
| Privacy | Minimize student data sent to AI; teacher notes class-scoped; define retention/deletion policy before launch |
| Reliability | Idempotency keys for writes, deterministic enrollment IDs, retryable sync events |
| Observability | Correlation/request IDs, structured errors, provider metrics, sync failure alerts |
| Accessibility | Mobile UI supports Vietnamese/English strings, dynamic text sizing, screen reader labels |
| Testing | Unit tests for services, API contract tests, Firebase emulator integration tests, mobile sync E2E tests |

## 7. Delivery Plan and Acceptance Criteria

### Sprint 1: Foundation

- Firebase Auth middleware and role claims.
- Firestore collections, rules, indexes, user profile/token registration.
- Class create/join/list APIs.

### Sprint 2: Core Sync

- Assignment CRUD.
- Projection fan-out and FCM payloads.
- Unified schedule query and reconciliation behavior.

### Sprint 3: AI/OCR

- Provider adapters, strict schemas, quotas, timeout/error states.
- OCR confirmation flow and personal deadline creation.
- Teacher AI asset history and edit-before-share UI.

### MVP Acceptance Checklist

- A teacher can create a class and obtain a unique six-character code.
- A student can join once; duplicate joins are rejected without duplicate data.
- An assignment appears in every active enrolled student's schedule after one teacher action.
- FCM is sent to valid registered tokens and invalid tokens are pruned.
- Student schedule returns classes and pending deadlines sorted by due date.
- OCR results are editable and ambiguous dates require confirmation.
- Quiz generation returns exactly 10 schema-valid questions for a normal request within 30 seconds.
- Unauthorized roles and non-owners cannot access or mutate protected class data.
- Firebase Emulator Suite tests cover class join, assignment fan-out, and security rules.
