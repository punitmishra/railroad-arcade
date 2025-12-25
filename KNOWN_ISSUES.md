# Known Issues and Technical Debt

This document tracks known bugs, issues, and technical debt identified in the Railroad Arcade codebase.

**Last Updated:** December 2025

---

## Critical Issues (FIXED)

### 1. ~~Race Condition in Tournament Registration~~ - FIXED
**File:** `app/api/tournaments/[id]/register/route.ts`
**Status:** RESOLVED

**Fix Applied:** Refactored to use interactive transaction (`db.$transaction(async (tx) => {...})`) that performs all checks and mutations atomically. Capacity check, duplicate registration check, token validation, and entry creation all happen within the same transaction.

**Additional Improvements:**
- Added tournament status check (must be REGISTRATION or SCHEDULED)
- Added user cache invalidation after successful registration

---

### 2. ~~No Idempotency in Prize Distribution~~ - FIXED
**File:** `app/api/queue/process/route.ts`
**Status:** RESOLVED

**Fix Applied:** Added idempotency check that queries for existing prize transactions before distributing. If any `tournament_prize` transaction exists for the tournament, distribution is skipped.

**Additional Improvements:**
- Added status verification (must be COMPLETED)
- Moved cache invalidation outside transaction for better performance

---

### 3. ~~Race Condition in Tournament Status Transitions~~ - FIXED
**File:** `app/api/queue/process/route.ts`
**Status:** RESOLVED

**Fix Applied:** Wrapped status check in interactive transaction. Each tournament is re-fetched inside the transaction for atomic status verification before any updates.

**Additional Improvements:**
- Added proper tie handling in rank calculation (tied scores get same rank)
- Status transition to COMPLETED now happens atomically with rank updates

---

## High Priority Issues (FIXED)

### 4. ~~Missing Input Validation in Tournament Creation~~ - FIXED
**File:** `app/api/tournaments/route.ts`
**Severity:** HIGH
**Status:** RESOLVED

**Fix Applied:** Added comprehensive `validateTournamentInput()` function that validates:
- Required string fields (name, with length limit of 100 chars)
- Enum validation for type and gameMode
- Date parsing and logical order (registrationStart < registrationEnd <= startTime < endTime)
- Numeric bounds (maxParticipants 1-10000, entryFee >= 0, minLevel 1-5, attempts 1-100, prizePool >= 0)

Returns structured error array with field names and messages for API response.

---

### 5. ~~Tied Scores Not Handled in Finalization~~ - FIXED
**File:** `app/api/queue/process/route.ts`
**Severity:** HIGH
**Status:** RESOLVED

**Fix Applied:** Implemented dense ranking where tied entries (same score AND same bestTime) share the same rank. Ranking logic now tracks previous score/time and only increments rank when values differ.

---

### 6. ~~Memory Leak in useRealtime Hook~~ - FIXED
**File:** `hooks/useRealtime.ts`
**Severity:** HIGH
**Status:** RESOLVED

**Fix Applied:**
- `onerror` handler now closes and nulls `eventSourceRef` before attempting reconnection
- Added exponential backoff with 1.5x multiplier for reconnection delays
- `connect()` now clears pending reconnect timeout and closes existing connection before creating new one

---

### 7. ~~SSE Stream Cleanup on Abrupt Disconnect~~ - FIXED
**File:** `lib/realtime.ts`
**Severity:** HIGH
**Status:** RESOLVED

**Fix Applied:**
- Moved cleanup variables (`heartbeat`, `unsubscribeFns`, `isClosed`) to outer scope
- Added proper `cancel()` method to ReadableStream that clears interval and unsubscribes
- Added `isClosed` flag to prevent enqueue attempts after stream is closed
- Heartbeat handler checks `isClosed` before sending pings

---

### 8. ~~Rank Calculation Mismatch Between Submit and Leaderboard~~ - FIXED
**File:** `app/api/tournaments/[id]/submit/route.ts`
**Severity:** MEDIUM (was HIGH)
**Status:** RESOLVED

**Fix Applied:** Updated rank calculation query to use same tiebreakers as leaderboard:
1. Higher score wins
2. Lower bestTime wins (if scores tied)
3. Earlier registration wins (if score and time tied)

Uses `OR` clause to count entries that are strictly better by any tiebreaker.

---

### 9. ~~Tournament Status Not Validated Before Score Submission~~ - FIXED
**File:** `app/api/tournaments/[id]/submit/route.ts`
**Severity:** MEDIUM (was HIGH)
**Status:** RESOLVED

**Fix Applied:** Added explicit status check before time window validation:
```typescript
if (tournament.status !== 'ACTIVE') {
  return NextResponse.json(
    { success: false, error: `Tournament is not active. Current status: ${tournament.status}` },
    { status: 400 }
  );
}
```

Also added validation for optional `time` parameter.

---

### 10. ~~Unsafe Enum Cast in Tournament List~~ - FIXED
**File:** `app/api/tournaments/route.ts`
**Severity:** MEDIUM (was HIGH)
**Status:** RESOLVED

**Fix Applied:** Added `VALID_STATUSES` array and validation before casting:
```typescript
const VALID_STATUSES: TournamentStatus[] = ['SCHEDULED', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
if (statusParam && statusParam !== 'all') {
  if (!VALID_STATUSES.includes(statusParam as TournamentStatus)) {
    return NextResponse.json({ error: `Invalid status...` }, { status: 400 });
  }
}
```

Also added limit bounds validation (1-100).

---

### 11. N+1 Query in Tournament List
**File:** `app/api/tournaments/route.ts` (lines 37-77)
**Severity:** MEDIUM

For each tournament, a separate query checks if user is registered. With 10 tournaments = 10+ extra queries.

**Fix Required:** Use single `findMany` query to get all user entries.

---

### 12. Incomplete Cache Invalidation
**File:** `app/api/tournaments/[id]/submit/route.ts` (line 146)
**Severity:** MEDIUM

Only invalidates `tournament:{id}:leaderboard:50:0`. Other pagination parameters remain stale.

**Fix Required:** Use pattern-based cache deletion.

---

### 13. Missing SSE Reconnection in useTournament
**File:** `hooks/useTournament.ts` (lines 328-331)
**Severity:** MEDIUM

SSE `onerror` handler closes connection without reconnection attempt.

**Fix Required:** Add exponential backoff reconnection logic.

---

### 14. Circular Dependency in useSessionHistory
**File:** `hooks/useSessionHistory.ts` (line 171)
**Severity:** MEDIUM

`fetchSessions` includes `sessions` in dependency array, causing excessive recreations.

**Fix Required:** Remove `sessions` from dependencies, use functional setState.

---

## Low Priority Issues

### 15. Missing Audit Logging for Admin Operations
**File:** `app/api/admin/tournaments/[id]/route.ts`
**Severity:** LOW

Admin updates and cancellations don't log which admin made the change.

**Fix Suggested:** Add audit table with timestamp, admin ID, action type.

---

### 16. Incomplete Stub Functions
**File:** `app/api/queue/process/route.ts` (lines 229-242)
**Severity:** LOW

Email and thumbnail handlers only log, don't actually send emails or generate thumbnails.

**Fix Required:** Integrate with email provider and image processing service.

---

### 17. Console Statements in Production
**Files:** Multiple (127 statements found)
**Severity:** LOW

Console.log/error/warn statements throughout codebase. Should use proper logger.

**Key Files:**
- `app/api/queue/process/route.ts` (19 statements)
- `app/api/payments/stripe/webhook/route.ts` (8 statements)
- `app/api/payments/paypal/webhook/route.ts` (11 statements)

---

### 18. ~~Missing User Cache Invalidation on Registration~~ - FIXED
**File:** `app/api/tournaments/[id]/register/route.ts`
**Severity:** LOW
**Status:** RESOLVED

Token balance decremented but cache not invalidated. Users see stale balance.

**Fix Applied:** Added `userCache.invalidateBalance(userId)` after successful registration.

---

### 19. Using `<img>` Instead of Next.js `<Image />`
**Files:** `components/SnapshotGallery.tsx`, `components/CameraFeed.tsx`
**Severity:** LOW

ESLint disabled for `<img>` elements. Should use Next.js Image for optimization.

**Note:** MJPEG streams require `<img>` tag, so this is partially intentional.

---

## TODO Comments in Code

1. `app/api/tournaments/route.ts:107` - "TODO: Add proper admin check"
2. `app/api/queue/process/route.ts:230` - "TODO: Integrate with email provider"
3. `app/api/queue/process/route.ts:240` - "TODO: Generate thumbnail using image processing service"

---

## Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 3 | **ALL FIXED** |
| HIGH | 7 | **ALL FIXED** |
| MEDIUM | 3 | Open |
| LOW | 4 | Open (1 fixed - cache invalidation) |

---

## Recommended Priority Order

1. ~~**Fix race conditions** (Issues #1, #2, #3)~~ - **FIXED**
2. ~~**Add input validation** (Issue #4)~~ - **FIXED**
3. ~~**Fix memory leaks** (Issues #6, #7)~~ - **FIXED**
4. ~~**Fix ranking consistency** (Issues #5, #8, #9, #10)~~ - **FIXED**
5. **Optimize queries** (Issue #11) - Performance
6. **Fix cache invalidation** (Issue #12) - Data freshness
7. **Add reconnection logic** (Issue #13) - User experience
8. **Clean up console statements** (Issue #17) - Code quality
