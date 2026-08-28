# ClassSync Mobile

React Native/Expo mobile app foundation. The app consumes the versioned backend contract in `docs/TECHNICAL_SPEC.md`.

The offline core is implemented without coupling to a native SQLite package. Inject an adapter around `react-native-sqlite-storage` or Expo SQLite through `SqliteDatabase`.

## Planned structure

- `src/core`: navigation, Firebase client, API client, dependency injection
- `src/core/storage/offline-repository.ts`: SQLite schema, cache, mutation queue, and LWW reads
- `src/core/sync/sync-engine.service.ts`: optimistic writes, connectivity flush, retry/backoff, and DLQ state
- `src/core/notifications/fcm-handler.ts`: foreground/opened/killed-state deep-link routing
- `src/shared`: design system, widgets, validation, localization
- `src/features/auth`: sign-in and account state
- `src/features/student`: schedule, deadlines, OCR capture
- `src/features/teacher`: classes, roster, assignments, AI preparation

The current app shell includes Student Dashboard, Teacher Dashboard, OCR capture/confirmation, AI generator, profile mode switcher, bottom navigation, persistent Zustand mode state, and Firebase Messaging deep-link handling.

Firebase React Native Messaging requires an Expo development build or bare React Native build; it is not available in Expo Go. Camera/gallery preview works through Expo Image Picker.

## Sync contract

1. Save schedule/deadline changes locally and enqueue a deterministic mutation ID before making the UI visible.
2. `SyncEngineService` flushes when connectivity returns and marks failed mutations for retry or `DEAD_LETTER` after five attempts.
3. Remote records are accepted only when their `updatedAt` is newer than the local record (LWW).
4. Register the FCM client's foreground, notification-open, and initial-notification callbacks with `FCMHandler`; all valid assignment messages navigate to `assignment-detail`.

The current repository includes contract tests under `apps/backend/test`. Native camera, SQLite, and FCM adapter tests should be added in the generated mobile shell using the selected React Native test runner.
