# Railroad Arcade API Reference

Base URL: `https://railroad-arcade-v5.vercel.app/api`

## Authentication

Most endpoints require authentication via NextAuth.js session cookies. Include cookies in requests or use the `Authorization` header with a valid JWT token.

---

## Endpoints

### User

#### GET /api/user

Get current authenticated user data.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Player One",
    "tokenBalance": 150,
    "unlockedModules": ["police", "fireStation"],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/user/stats

Get user's play statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 42,
    "totalPlayTime": 12600,
    "highScores": {
      "FREE_PLAY": 1500,
      "SPEED_RUN": 2800
    },
    "achievementCount": 5,
    "level": 3
  }
}
```

#### POST /api/user/modules

Unlock a building module.

**Request:**
```json
{
  "moduleId": "smartHome"
}
```

**Response:**
```json
{
  "success": true,
  "module": "smartHome",
  "newBalance": 120
}
```

---

### Sessions

#### GET /api/user/sessions

Get user's session history with pagination.

**Query Parameters:**
- `limit` (number, default: 20) - Number of sessions to return
- `cursor` (string, optional) - Cursor for pagination

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "clx...",
      "gameMode": "SPEED_RUN",
      "score": 2500,
      "duration": 180,
      "isLive": false,
      "events": [...],
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "nextCursor": "clx...",
  "hasMore": true
}
```

#### POST /api/sessions

Start or end a play session.

**Request (Start):**
```json
{
  "action": "start",
  "gameMode": "SPEED_RUN",
  "isLive": false
}
```

**Request (End):**
```json
{
  "action": "end",
  "sessionId": "clx...",
  "score": 2500,
  "events": [
    { "type": "train_start", "timestamp": 1000, "data": { "trackId": 1 } }
  ]
}
```

---

### Leaderboards

#### GET /api/leaderboards

Get high scores by game mode.

**Query Parameters:**
- `gameMode` (string, required) - Game mode enum
- `isLive` (boolean, default: false) - Live mode filter
- `limit` (number, default: 10) - Number of entries

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "rank": 1,
      "userId": "clx...",
      "username": "Champion",
      "score": 5000,
      "createdAt": "2025-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### Tournaments

#### GET /api/tournaments

List available tournaments.

**Query Parameters:**
- `status` (string, optional) - Filter by status (SCHEDULED, REGISTRATION, ACTIVE, COMPLETED, CANCELLED, all)
- `limit` (number, default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "tournaments": [
    {
      "id": "clx...",
      "name": "Weekly Championship",
      "type": "WEEKLY",
      "status": "REGISTRATION",
      "gameMode": "SPEED_RUN",
      "startTime": "2025-01-20T18:00:00.000Z",
      "endTime": "2025-01-20T20:00:00.000Z",
      "maxParticipants": 100,
      "participantCount": 45,
      "prizePool": 500,
      "isRegistered": false
    }
  ]
}
```

#### POST /api/tournaments

Create a new tournament (Admin only).

**Headers:**
- `x-admin-key`: Admin API key

**Request:**
```json
{
  "name": "Daily Speed Run",
  "type": "DAILY",
  "gameMode": "SPEED_RUN",
  "registrationStart": "2025-01-19T00:00:00.000Z",
  "registrationEnd": "2025-01-19T17:00:00.000Z",
  "startTime": "2025-01-19T18:00:00.000Z",
  "endTime": "2025-01-19T19:00:00.000Z",
  "maxParticipants": 50,
  "entryFee": 10,
  "prizePool": 200,
  "attemptsPerPlayer": 3
}
```

#### GET /api/tournaments/[id]

Get tournament details.

**Response:**
```json
{
  "success": true,
  "tournament": {
    "id": "clx...",
    "name": "Weekly Championship",
    "description": "Compete for glory!",
    "rules": ["No cheating", "Have fun"],
    "prizes": [
      { "place": 1, "tokens": 200, "badge": "champion" },
      { "place": 2, "tokens": 100 },
      { "place": 3, "tokens": 50 }
    ]
  }
}
```

#### POST /api/tournaments/[id]/register

Register for a tournament.

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": "clx...",
    "tournamentId": "clx...",
    "userId": "clx...",
    "registeredAt": "2025-01-19T12:00:00.000Z"
  },
  "newBalance": 140
}
```

#### GET /api/tournaments/[id]/leaderboard

Get tournament leaderboard.

**Query Parameters:**
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "rank": 1,
      "userId": "clx...",
      "username": "TopPlayer",
      "score": 3500,
      "bestTime": 145.2,
      "attempts": 2
    }
  ],
  "userEntry": {
    "rank": 15,
    "score": 2100,
    "bestTime": 180.5,
    "attempts": 1,
    "attemptsRemaining": 2
  }
}
```

#### POST /api/tournaments/[id]/submit

Submit a tournament score.

**Request:**
```json
{
  "score": 2800,
  "time": 165.3
}
```

**Response:**
```json
{
  "success": true,
  "entry": {
    "score": 2800,
    "bestTime": 165.3,
    "attempts": 2,
    "rank": 8
  },
  "isNewHighScore": true,
  "attemptsRemaining": 1
}
```

---

### Payments

#### POST /api/payments/stripe

Create Stripe checkout session.

**Request:**
```json
{
  "package": "starter"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST /api/payments/paypal

Create PayPal order.

**Request:**
```json
{
  "package": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "...",
  "approvalUrl": "https://paypal.com/..."
}
```

---

### Snapshots

#### GET /api/snapshots

Get user's snapshot gallery.

**Query Parameters:**
- `filter` (string) - all, liked, level1, level2
- `limit` (number, default: 20)
- `cursor` (string, optional)

**Response:**
```json
{
  "success": true,
  "snapshots": [
    {
      "id": "clx...",
      "imageUrl": "https://...",
      "cameraId": "cam1",
      "liked": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST /api/snapshots

Capture a new snapshot.

**Request:**
```json
{
  "cameraId": "cam1",
  "imageData": "data:image/jpeg;base64,..."
}
```

---

### Real-time

#### GET /api/realtime

Server-Sent Events stream for real-time updates.

**Query Parameters:**
- `events` (string[], optional) - Filter event types

**Event Types:**
- `connected` - Connection established
- `ping` - Heartbeat
- `queue_update` - Queue status changed
- `session_update` - Session state changed
- `score_update` - Score submitted
- `achievement` - Achievement unlocked
- `tournament_update` - Tournament status changed
- `tournament_leaderboard` - Leaderboard updated

**Example Event:**
```
data: {"type":"queue_update","data":{"totalInQueue":5,"userPosition":3},"timestamp":1705312345678}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests / 10 seconds |
| Authentication | 5 requests / 1 minute |
| Payments | 10 requests / 1 minute |

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Webhooks

### Stripe

Endpoint: `POST /api/payments/stripe/webhook`

Verifies signature using `STRIPE_WEBHOOK_SECRET`.

### PayPal

Endpoint: `POST /api/payments/paypal/webhook`

Verifies webhook ID and signature.

### Coinbase Commerce

Endpoint: `POST /api/payments/coinbase/webhook`

Verifies signature using `COINBASE_WEBHOOK_SECRET`.
