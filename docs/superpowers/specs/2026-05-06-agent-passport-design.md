# Agent Passport — Design Spec
_Date: 2026-05-06_

## Context

AI agents need a cryptographic identity — a way to prove who they are, who owns them, and when they were created. This project builds a demo "Agent Passport" system: agents self-initialize a keypair locally, register their public key with an identity provider (IDP) server, and can be claimed by a human owner via email magic link. The result is a verifiable passport record for each agent.

Inspired by AAuth (Dick Hardt) and the Agent Auth Protocol — but scoped to a self-contained demo.

---

## Stack

| Piece | Choice |
|---|---|
| Framework | Next.js 15 (App Router), bootstrapped with `create-next-app` |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | SQLite via Prisma |
| Email | Resend SDK (console log fallback for local dev) |
| Crypto | Web Crypto API (built-in browser API, no deps) |

---

## Data Model

```prisma
model Passport {
  id          String    @id               // "agnt_" + 8 random bytes hex
  publicKey   String                      // Base64-encoded Ed25519 public key
  status      PassportStatus @default(UNCLAIMED)
  ownerEmail  String?                     // provided at registration
  name        String?
  description String?
  tags        Json?                       // arbitrary key-value object
  createdAt   DateTime  @default(now())
  claimedAt   DateTime?
  claimTokens ClaimToken[]
}

model ClaimToken {
  token       String    @id               // SHA-256 hash of raw 32-byte hex token
  passportId  String
  email       String
  expiresAt   DateTime                    // createdAt + 24h
  usedAt      DateTime?
  passport    Passport  @relation(fields: [passportId], references: [id])
}

enum PassportStatus {
  UNCLAIMED
  CLAIMED
  REVOKED
}
```

---

## Agent Init (Client-Side Only)

`init` is not an HTTP call — it runs entirely in the browser using the Web Crypto API:

```ts
// 1. Generate agentId
const randomBytes = crypto.getRandomValues(new Uint8Array(8))
const agentId = "agnt_" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')

// 2. Generate Ed25519 keypair
const keyPair = await crypto.subtle.generateKey(
  { name: "Ed25519" },
  true,
  ["sign", "verify"]
)

// 3. Export public key as Base64
const pubKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey)
const publicKey = btoa(String.fromCharCode(...new Uint8Array(pubKeyBuffer)))

// Private key stays in memory — never sent to server
```

---

## API Endpoints

All under `/api/`:

### `POST /api/passport/register`

**Request:**
```json
{
  "agentId": "agnt_a1b2c3d4",
  "publicKey": "<base64-encoded-ed25519-public-key>",
  "ownerEmail": "owner@example.com",
  "name": "My Agent",           // optional
  "description": "...",         // optional
  "tags": { "env": "prod" }     // optional
}
```

**Server actions:**
1. Validate agentId uniqueness and publicKey format
2. Create `Passport` record (status: `UNCLAIMED`)
3. Generate 32 random bytes → raw claim token (hex)
4. Store SHA-256 hash of token in `ClaimToken` (TTL: 24h)
5. Send magic link email to `ownerEmail`: `https://<host>/claim?token=<raw-hex>`
6. In local dev: log magic link to console instead of sending email

**Response:**
```json
{ "passportId": "agnt_a1b2c3d4", "status": "UNCLAIMED" }
```

---

### `POST /api/passport/claim`

**Request:**
```json
{ "token": "<raw-hex-token-from-email>" }
```

**Server actions:**
1. SHA-256 hash the incoming token
2. Look up `ClaimToken` by hash — verify not expired, not used
3. Mark `Passport.status = CLAIMED`, set `claimedAt`
4. Mark `ClaimToken.usedAt = now()`

**Response:**
```json
{ "passportId": "agnt_a1b2c3d4", "status": "CLAIMED" }
```

---

### `GET /api/passport/[id]`

Returns full passport record. `ownerEmail` masked (`m***@example.com`) until claimed.

---

### `GET /api/passport`

Returns list of all passports (for dashboard). Sorted by `createdAt` desc.

---

## UI Pages

### `/` — Registry
- Table of all passports: Agent ID, Name, Status badge, Created At, Owner (masked)
- Click row → navigate to `/passport/[id]`
- "Init New Agent" button → `/init`

### `/init` — Init & Register
Step 1: "Init Agent" button
- Runs local keygen (Web Crypto API)
- Displays generated Agent ID and public key (copyable)
- Private key shown once with copy button and warning ("Save this — it never leaves your browser")

Step 2: Registration form
- ownerEmail (required)
- name, description, tags (optional)
- "Register" button → POST `/api/passport/register`

Step 3: Success state
- Passport ID, UNCLAIMED badge
- "Magic link sent to {email}"
- Link to passport detail page

### `/passport/[id]` — Passport Card
- Agent ID, public key (truncated + "show full" toggle)
- Status badge (UNCLAIMED / CLAIMED / REVOKED)
- Owner email (masked)
- Created at, claimed at
- Name, description, tags if present

### `/claim` — Claim Landing
- URL: `/claim?token=<hex>`
- Shows which agent is being claimed (fetched by token lookup)
- "Confirm Ownership" button → POST `/api/passport/claim`
- On success: redirect to `/passport/[id]`
- On error (expired/used): clear error message

---

## Email

- **Production:** Resend SDK — one `emails.send()` call
- **Local dev:** Log magic link URL to console (no Resend account needed)
- Detected via `RESEND_API_KEY` env var — if absent, falls back to console

---

## Verification

1. `npm run dev` starts app on localhost:3000
2. Navigate to `/init` → click "Init Agent" → confirm ID and public key appear
3. Fill in ownerEmail, name → click "Register" → confirm success screen + console magic link
4. Open magic link in browser → confirm `/claim` page shows correct agent
5. Click "Confirm Ownership" → confirm redirect to `/passport/[id]` with CLAIMED status
6. Navigate to `/` → confirm agent appears in registry with correct status
