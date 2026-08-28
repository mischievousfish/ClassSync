# ClassSync

> **Smart Management & AI Assistant for Students & Teachers**
> Nền tảng quản lý học tập thông minh và trợ lý AI cho học sinh, giáo viên.

ClassSync is a two-mode EdTech application that connects student schedules with teacher classroom workflows. A teacher publishes a class schedule or assignment once; enrolled students receive the updated deadline in their unified schedule and an instant Firebase Cloud Messaging (FCM) alert.

ClassSync la ung dung EdTech hai che do: Student Mode tap trung vao lich hoc va deadline, Teacher Mode tap trung vao quan ly lop va soan bai bang AI.

## Key Features | Tinh nang chinh

- **Dual-Mode UI:** dedicated Student Mode and Teacher Mode with shared account and data.
- **30s AI Quiz/Lesson Prep:** generate a structured 10-question quiz or lesson outline from a topic/document.
- **Smart AI Remind & OCR:** photograph an assignment, extract its text and suggested due date, then confirm a deadline.
- **2-Way Auto Sync:** assignment and schedule changes fan out to all active enrollments and trigger FCM alerts.
- **Student Micro-Profile:** class-scoped private teacher notes and learning tags for personalization.

## Architecture and Tech Stack

- **Mobile frontend:** React Native clean-architecture scaffold in `apps/mobile`; Flutter remains a supported client alternative.
- **Backend API:** Node.js 20, Express, TypeScript, Zod validation, modular controllers/services/routes.
- **AI engine:** Gemini adapter for quiz and lesson-outline generation, with strict structured-output validation.
- **OCR engine:** Google Cloud Vision adapter (Tesseract can be used as a local fallback).
- **Identity and data:** Firebase Authentication and Firestore via Firebase Admin SDK.
- **Push and real-time:** Firebase Cloud Messaging plus Firestore listeners and per-student schedule projections.
- **Local infrastructure:** Docker Compose with the Firebase Auth and Firestore Emulator Suite.

## Repository Structure

```text
ClassSync/
|-- apps/
|   |-- backend/
|   |   |-- src/
|   |   |   |-- config/          # Firebase Admin initialization
|   |   |   |-- controllers/     # HTTP request/response handlers
|   |   |   |-- middleware/       # Firebase auth and role guards
|   |   |   |-- models/           # TypeScript data interfaces
|   |   |   |-- routes/           # Authenticated API routes
|   |   |   |-- services/         # Class, assignment, sync, profile use cases
|   |   |   |-- shared/           # Errors and request validation
|   |   |   |-- app.ts
|   |   |   `-- server.ts
|   |   |-- Dockerfile
|   |   `-- tsconfig.json
|   `-- mobile/
|       |-- src/
|       |   |-- core/             # Navigation, API and Firebase clients
|       |   |-- shared/           # UI kit, localization and validation
|       |   |-- features/auth/
|       |   |-- features/student/ # Schedule, deadline and OCR flows
|       |   `-- features/teacher/ # Classes, roster and AI preparation
|       `-- README.md
|-- docs/
|   `-- TECHNICAL_SPEC.md         # SRS, schema, API and sync contract
|-- docker-compose.yml
|-- firebase.json
|-- .env.example
|-- package.json
`-- package-lock.json
```

## Quick Start | Bat dau nhanh

### Prerequisites | Yeu cau

- Node.js 20+ and npm 10+
- Docker Desktop/Engine and Docker Compose v2
- Firebase CLI (`npm install -g firebase-tools`)
- React Native CLI and Android Studio/Xcode for native mobile development
- A Firebase project with Authentication, Firestore and Cloud Messaging enabled for non-emulator use

### Backend local development

```bash
npm install
cp .env.example .env
# Fill Firebase service-account and provider keys in .env
npm run typecheck
npm run build
npm run dev
```

The backend listens on `http://localhost:3000` and mounts routes under `/api/v1` by default. `/api` is also available as a compatibility alias for the original scaffold clients.

### Local Firebase with Docker

```bash
cp .env.example .env
docker compose up --build
```

The Emulator UI is available at `http://localhost:4000`, Firestore at port `8080`, Auth at port `9099`, and the API at port `3000`. The container uses project ID `demo-classsync` and does not require production credentials.

### Mobile development

The mobile directories are an architecture scaffold. Initialize the native shell when choosing the client runtime:

```bash
npx react-native@latest init ClassSyncMobile
cd ClassSyncMobile
npm start
npx react-native run-android
```

Move or map the generated app into `apps/mobile`, configure Firebase client credentials per platform, and point the API base URL at `http://10.0.2.2:3000/api/v1` for the Android emulator (`localhost` for iOS simulator).

## Environment Variables Checklist

Copy `.env.example` to `.env`; never commit `.env` or service-account secrets.

| Key | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | yes | `development`, `test`, or `production` |
| `PORT` | yes | Backend HTTP port, default `3000` |
| `API_PREFIX` | yes | Versioned route prefix, normally `/api/v1` |
| `FIREBASE_CONFIG` | recommended | JSON service-account config for deployment tooling |
| `FIREBASE_PROJECT_ID` | yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | yes | Firebase Admin service-account email |
| `FIREBASE_PRIVATE_KEY` | yes | Newline-escaped Admin private key |
| `GEMINI_API_KEY` | for AI | Gemini provider credential |
| `GEMINI_MODEL` | for AI | Model name, e.g. `gemini-2.0-flash` |
| `CLOUD_VISION_KEY` | for OCR | Google Cloud Vision API key |
| `CLOUD_VISION_PROJECT_ID` | for OCR | Google Cloud project for Vision |
| `JWT_SECRET` | future auth | Secret for app-issued tokens if introduced; Firebase ID tokens are current auth |
| `FCM_ENABLED` | yes | Enable/disable push delivery in local or test environments |
| `OCR_MAX_FILE_SIZE_MB` | no | Upload size limit, default policy 10 MB |
| `AI_REQUEST_TIMEOUT_MS` | no | AI provider timeout, default policy 30 seconds |

## API Reference Summary

All protected endpoints require `Authorization: Bearer <Firebase ID token>`. The token must carry the custom claim `role` with value `STUDENT` or `TEACHER`.

| Method | Endpoint | Role | Action |
| --- | --- | --- | --- |
| `POST` | `/api/v1/classes` | Teacher | Create class and unique six-character join code |
| `GET` | `/api/v1/classes` | Any | List classes relevant to current user |
| `POST` | `/api/v1/classes/join` | Student | Join with `class_code` |
| `GET` | `/api/v1/classes/{classId}/students` | Teacher | View active class roster |
| `POST` | `/api/v1/assignments` | Teacher | Create, sync and notify assignment |
| `PATCH` | `/api/v1/assignments/{assignmentId}` | Teacher | Update assignment and projection |
| `GET` | `/api/v1/student/schedule` | Student | Fetch unified classes and pending deadlines |
| `POST` | `/api/v1/ai/generate-quiz` | Teacher | Generate structured 10-question quiz |
| `POST` | `/api/v1/ai/generate-lesson` | Teacher | Generate lesson outline |
| `POST` | `/api/v1/ocr/parse-assignment` | Student | Extract text/title/due date from image |
| `PUT` | `/api/v1/classes/{classId}/students/{studentId}/profile` | Teacher | Update micro-profile notes/tags |
| `PUT` | `/api/v1/users/me/fcm-tokens` | Any | Register a device token |

See [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md) for request schemas, response examples, Firestore indexes, security rules and the FCM payload contract.

## Development Commands

```bash
npm run dev          # Watch backend source
npm run typecheck   # Strict TypeScript validation
npm run build       # Production compile to apps/backend/dist
npm start            # Run compiled backend
npm test             # Jest API, RBAC, OCR contract and mobile state tests
npm run test:coverage # Coverage gate (80% for deterministic backend logic)
```

Tests live in `apps/backend/test`. Firebase, Gemini, Cloud Vision, FCM, and multipart boundaries are mocked so the suite runs without credentials. Add Firebase Emulator integration tests for the full Firestore fan-out and notification worker before enabling those provider-bound modules in the coverage collection.

## Security and Operations

- Validate Firebase ID tokens server-side and enforce role plus resource ownership.
- Keep Firestore canonical records separate from the read-optimized student schedule projection.
- Treat FCM as best-effort delivery; clients reconcile from Firestore.
- Use idempotency keys and retryable sync events for large classes.
- Add production rate limiting, HTTPS, upload scanning, provider quotas, and Firebase Emulator integration tests before launch.

## License

Internal project documentation. Add the repository's chosen license before public distribution.
