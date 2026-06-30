// ============================================================================
// Data access layer — barrel.
//
// This file used to hold ~1600 lines of mixed Firestore/auth/localStorage logic.
// It is now split into domain modules under ./db/* and re-exported here so every
// existing `import { ... } from '@/lib/db'` (or '../lib/db') keeps working with
// zero changes. Add new data functions to the relevant domain module, not here.
//
//   ./db/users         — users collection reads/writes + subscribeToUsers
//   ./db/jobs          — jobs collection, job history, hire/apply/complete flow
//   ./db/reviews       — review CRUD + rating recalculation
//   ./db/notifications — notifications fetch/subscribe/create/delete
//   ./db/session       — localStorage session, login, register, auth
// ============================================================================

export * from './db/users';
export * from './db/jobs';
export * from './db/reviews';
export * from './db/notifications';
export * from './db/session';
