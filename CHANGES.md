# RBAC & Doctor Verification — Change Log

## Database (`create_table.sql`)

### `Doctors` table — bug fix + new columns
- **Fixed**: `ApprovalStatus` line ended with `;` instead of `,`, which silently dropped the `FOREIGN KEY` constraint. Now corrected.
- **Added**: `ReviewedBy INT` — FK to `Users(UserId)`, records which admin approved/rejected.
- **Added**: `ReviewedAt TIMESTAMP` — timestamp of the review decision.
- `ApprovalStatus` is now `NOT NULL DEFAULT 'Pending'` with values `('Pending', 'Approved', 'Rejected')`.

### Migration stubs (bottom of file)
Commented-out `ALTER TABLE` statements are provided for running against an already-existing database:
- Add missing FK on `Doctors.DoctorId`
- Add `ReviewedBy` and `ReviewedAt` columns
- Backfill and set `ApprovalStatus NOT NULL`

---

## Auth layer

### `src/lib/auth/session.ts`
- `SessionPayload` now includes `role: string` and optional `doctorStatus?: string`.

### `src/lib/auth/current-user.ts`
- `CurrentUser` type now includes `role: string` and optional `doctorStatus?: string`.
- `getCurrentUser()` returns both fields from the JWT payload.

---

## Repository (`src/lib/repositories/user-repository.ts`)

### Removed
- Unused imports: `randomUUID`, `email` (from zod), `promises` (from dns).
- Unused `const id = randomUUID()` inside `createUser`.

### New types
| Type | Description |
|---|---|
| `DoctorInfo` | Shape of a `Doctors` table row |
| `PendingDoctorRow` | `UserInfo & DoctorInfo` — result of the pending-doctors JOIN query |

### `createUser` — updated return type
Now returns `role` in addition to `userid`, `email`, `firstname`, `lastname`.

### New functions
| Function | Description |
|---|---|
| `findUserById(userId)` | Look up a user row by primary key |
| `findDoctorByUserId(userId)` | Look up the `Doctors` row for a given user; returns `null` if not a doctor |
| `createDoctor(input)` | Insert a row into `Doctors` after user creation; defaults `ApprovalStatus` to `'Pending'` |
| `listPendingDoctors()` | JOIN `doctors + users` WHERE `approvalstatus = 'Pending'`; used by the admin API |
| `reviewDoctor(input)` | UPDATE `approvalstatus`, `reviewedby`, `reviewedat` for a given doctor |

---

## API routes

### `src/app/api/auth/register/route.ts` — updated
- Accepts optional doctor fields: `registrationnumber` (required for doctor path), `designation`, `startpracticedate`, `registrationexpiry`.
- **Role is derived server-side** — the client can never force `Admin` or `Doctor` via the request body.
- If `registrationnumber` is present → role is set to `'Doctor'`, a `Doctors` row is inserted, and `doctorStatus: 'Pending'` is included in the JWT and response.
- Otherwise → role is `'User'`.

### `src/app/api/auth/login/route.ts` — updated
- For `Doctor` accounts, `ApprovalStatus` is read fresh from the database on every login.
- JWT and response body now include `role` and `doctorStatus` (doctors only).
- Removed unused `import next from "next"`.

### `src/app/api/admin/doctors/pending/route.ts` — new
```
GET /api/admin/doctors/pending
```
- Returns all doctors with `ApprovalStatus = 'Pending'`, joined with their user info.
- Password hashes are stripped before the response is sent.
- Returns `401` if not authenticated, `403` if role is not `Admin`.

### `src/app/api/admin/doctors/review/route.ts` — new
```
POST /api/admin/doctors/review
Body: { doctorid: number, status: "Approved" | "Rejected" }
```
- Updates the doctor's `ApprovalStatus`, sets `ReviewedBy` to the calling admin's user id, and sets `ReviewedAt` to now.
- Returns `401` / `403` for unauthenticated or non-admin callers.
- Returns `404` if no matching doctor record exists.
