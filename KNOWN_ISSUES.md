# Known Issues and Technical Debt

This document tracks known bugs, issues, and technical debt identified in the Railroad Arcade codebase.

**Last Updated:** December 2025

---

## Critical Issues

### 1. Race Condition in Tournament Registration
**File:** `app/api/tournaments/[id]/register/route.ts` (lines 70-160)
**Severity:** CRITICAL

The registration endpoint checks if tournament is full, then later deducts tokens and creates entry. Between these operations, another user could register, causing the tournament to exceed `maxParticipants`.

**Impact:** Two users can register simultaneously, both pass the capacity check, both get tokens deducted, but tournament exceeds max capacity.

**Fix Required:** Move capacity check inside database transaction or use conditional create with unique constraint.

---

### 2. No Idempotency in Prize Distribution
**File:** `app/api/queue/process/route.ts` (lines 396-483)
**Severity:** CRITICAL

No validation that tournament is in COMPLETED status before distributing prizes. Can distribute prizes multiple times if handler is retried.

**Impact:** Users can receive duplicate prize tokens on QStash retries.

**Fix Required:** Add status check and mark tournament as "prizes_distributed" after completion.

---

### 3. Race Condition in Tournament Status Transitions
**File:** `app/api/queue/process/route.ts` (lines 287-329)
**Severity:** CRITICAL

Multiple concurrent calls to `handleTournamentStatusCheck` can cause duplicate finalization jobs or status updates.

**Fix Required:** Use database transaction with `SELECT ... FOR UPDATE` lock.

---

## High Priority Issues

### 4. Missing Input Validation in Tournament Creation
**File:** `app/api/tournaments/route.ts` (lines 117-133)
**Severity:** HIGH

No validation on input fields:
- No check if `name` is empty or too long
- No validation that dates are in logical order (registrationStart < registrationEnd < startTime < endTime)
- No validation that numeric fields are positive

**Fix Required:** Add Zod schema validation for tournament creation.

---

### 5. Tied Scores Not Handled in Finalization
**File:** `app/api/queue/process/route.ts` (lines 363-376)
**Severity:** HIGH

Rank calculation uses simple index+1, ignoring tied scores. Two users with identical scores get different ranks.

**Fix Required:** Implement proper tie-breaking with shared ranks.

---

### 6. Memory Leak in useRealtime Hook
**File:** `hooks/useRealtime.ts` (lines 88-101)
**Severity:** HIGH

The `onerror` handler doesn't properly null out `eventSourceRef` before reconnection, causing multiple EventSource connections to pile up.

**Fix Required:** Clear reference before creating new connection.

---

### 7. SSE Stream Cleanup on Abrupt Disconnect
**File:** `lib/realtime.ts` (lines 241-280)
**Severity:** HIGH

If a client disconnects abruptly, realtime event subscribers remain in memory indefinitely.

**Fix Required:** Implement heartbeat-based dead connection detection.

---

### 8. Rank Calculation Mismatch Between Submit and Leaderboard
**File:** `app/api/tournaments/[id]/submit/route.ts` (lines 104-117)
**Severity:** MEDIUM

Score submission calculates rank only by score, but leaderboard uses tiebreakers (bestTime, registeredAt). Player shown rank 5 after submission may show rank 7 in leaderboard.

**Fix Required:** Use consistent ranking logic in both places.

---

### 9. Tournament Status Not Validated Before Score Submission
**File:** `app/api/tournaments/[id]/submit/route.ts` (lines 49-62)
**Severity:** MEDIUM

Only checks time window, not `status` field. A CANCELLED tournament could accept scores if dates match.

**Fix Required:** Add `tournament.status === 'ACTIVE'` check.

---

### 10. Unsafe Enum Cast in Tournament List
**File:** `app/api/tournaments/route.ts` (lines 15, 19-25)
**Severity:** MEDIUM

Status parameter cast bypasses type checking. Invalid enum values passed to Prisma could cause errors.

**Fix Required:** Validate enum value before using.

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

### 18. Missing User Cache Invalidation on Registration
**File:** `app/api/tournaments/[id]/register/route.ts` (lines 132-160)
**Severity:** LOW

Token balance decremented but cache not invalidated. Users see stale balance.

**Fix Required:** Add `userCache.invalidateBalance(session.user.id)`.

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
| CRITICAL | 3 | Open |
| HIGH | 7 | Open |
| MEDIUM | 6 | Open |
| LOW | 5 | Open |

---

## Recommended Priority Order

1. **Fix race conditions** (Issues #1, #2, #3) - Can cause data corruption
2. **Add input validation** (Issue #4) - Security concern
3. **Fix memory leaks** (Issues #6, #7) - Affects stability
4. **Fix ranking consistency** (Issues #5, #8) - Affects fairness
5. **Add status checks** (Issue #9) - Logic correctness
6. **Optimize queries** (Issue #11) - Performance
7. **Fix cache invalidation** (Issue #12) - Data freshness
8. **Add reconnection logic** (Issue #13) - User experience
9. **Clean up console statements** (Issue #17) - Code quality
