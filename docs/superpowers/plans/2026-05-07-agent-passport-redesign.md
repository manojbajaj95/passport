# Agent Passport Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Agent Passport around DID-based identity (did:key), challenge-response authentication, and JWKS-verified identity tokens — replacing the old agentId-based registry.

**Architecture:** Agents register a `did:key` identifier (public key encoded in the DID), optionally link a human owner via email claim, then prove key ownership via Ed25519 challenge-response to receive a short-lived JWT. Apps verify the JWT locally using the registry's JWKS endpoint — no runtime API dependency.

**Tech Stack:** Next.js 16 App Router, Prisma 7 + Neon PostgreSQL, `jose` (JWT), `@noble/ed25519` (Ed25519 ops), `@scure/base` (base58btc for DID parsing), Vitest, Resend (email), Tailwind + shadcn (UI)

---

## File Map

### New files
| Path | Responsibility |
|---|---|
| `docs/specs/agent-passport-spec.md` | Formal specification (already written) |
| `src/lib/did.ts` | Parse `did:key` → extract Ed25519 public key; encode public key → DID |
| `src/lib/handle.ts` | Generate and validate `adverb-adjective-noun` handles |
| `src/lib/server-keys.ts` | Load/generate server Ed25519 keypair for JWT signing |
| `src/lib/jwt.ts` | Sign and verify passport identity tokens |
| `src/app/.well-known/jwks.json/route.ts` | Serve registry public key as JWKS |
| `src/app/api/passport/challenge/route.ts` | Issue nonce for challenge-response |
| `src/app/api/passport/token/route.ts` | Verify Ed25519 sig, issue identity JWT |
| `src/app/demo/page.tsx` | Interactive demo of the full agent flow |
| `src/components/demo-flow.tsx` | Client component driving the demo steps |

### Modified files
| Path | Change |
|---|---|
| `prisma/schema.prisma` | Replace old `Passport` (id-based) with `did`-primary + `handle` unique + `Nonce` model |
| `prisma/migrations/` | New migration after schema reset |
| `src/app/api/passport/register/route.ts` | Accept `did`, auto-generate handle, extract public key from DID |
| `src/app/api/passport/claim/route.ts` | Update field references (`passportId` → `did`) |
| `src/app/api/passport/[id]/route.ts` | Rename to `[handle]/route.ts`, query by handle |
| `src/app/api/passport/route.ts` | Update select fields for new schema |
| `src/lib/email.ts` | Update param name `passportId` → `handle` |
| `src/types/passport.ts` | Add `did`, `handle`; remove old `id` |
| `src/components/init-form.tsx` | Update to send `did` instead of `agentId` |

### Deleted files
| Path | Reason |
|---|---|
| `src/app/api/passport/[id]/route.ts` | Replaced by `[handle]/route.ts` |

---

## Task 1: Install Dependencies

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/mbajaj/src/for-agents/passport
pnpm add jose @noble/ed25519 @noble/hashes @scure/base
```

Expected: packages added without errors.

- [ ] **Step 2: Verify install**

```bash
node -e "require('jose'); require('@noble/ed25519'); require('@scure/base'); console.log('ok')"
```

Expected: prints `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add jose, @noble/ed25519, @noble/hashes, @scure/base"
```

---

## Task 2: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260507000000_redesign/migration.sql`

- [ ] **Step 1: Replace schema**

Replace the entire content of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model Passport {
  did         String         @id
  handle      String         @unique
  publicKey   String
  status      PassportStatus @default(UNCLAIMED)
  ownerEmail  String?
  name        String?
  description String?
  createdAt   DateTime       @default(now())
  claimedAt   DateTime?
  claimTokens ClaimToken[]
  nonces      Nonce[]
}

model ClaimToken {
  token     String    @id
  did       String
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  passport  Passport  @relation(fields: [did], references: [did])
}

model Nonce {
  id        String    @id @default(cuid())
  did       String
  nonce     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  passport  Passport  @relation(fields: [did], references: [did])
}

enum PassportStatus {
  UNCLAIMED
  CLAIMED
  REVOKED
}
```

- [ ] **Step 2: Reset and migrate**

```bash
pnpm exec prisma migrate reset --force
pnpm exec prisma migrate dev --name redesign
```

Expected: migration created, client regenerated.

- [ ] **Step 3: Verify generated client**

```bash
ls src/generated/prisma/models/
```

Expected: `Passport.ts`, `ClaimToken.ts`, `Nonce.ts` (or equivalent output)

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/generated/
git commit -m "feat: redesign schema — did-primary, handle, nonce model"
```

---

## Task 3: DID Utilities

**Files:**
- Create: `src/lib/did.ts`
- Create: `src/lib/__tests__/did.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/did.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractPublicKeyFromDid, didFromPublicKey } from '../did'

describe('extractPublicKeyFromDid', () => {
  it('extracts 32-byte public key from a valid did:key', () => {
    // Known Ed25519 did:key with known public key bytes
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
    const key = extractPublicKeyFromDid(did)
    expect(key).toBeInstanceOf(Uint8Array)
    expect(key.length).toBe(32)
  })

  it('throws on non-did:key input', () => {
    expect(() => extractPublicKeyFromDid('did:web:example.com')).toThrow()
  })

  it('throws on did:key with non-Ed25519 key type', () => {
    // P-256 multicodec prefix is 0x80 0x24, not 0xed 0x01
    expect(() => extractPublicKeyFromDid('did:key:zDnaeWJjH2qJMdvb')).toThrow()
  })
})

describe('didFromPublicKey', () => {
  it('round-trips: encode then decode yields same key', () => {
    const original = new Uint8Array(32).fill(42)
    const did = didFromPublicKey(original)
    const recovered = extractPublicKeyFromDid(did)
    expect(recovered).toEqual(original)
  })

  it('produces a string starting with did:key:z6Mk', () => {
    const key = new Uint8Array(32).fill(1)
    expect(didFromPublicKey(key)).toMatch(/^did:key:z6Mk/)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test src/lib/__tests__/did.test.ts
```

Expected: FAIL — `did.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/did.ts`**

```typescript
import { base58 } from '@scure/base'

const ED25519_PREFIX = new Uint8Array([0xed, 0x01])

export function extractPublicKeyFromDid(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Only did:key with base58btc encoding (z prefix) is supported')
  }
  const encoded = did.slice('did:key:z'.length)
  const decoded = base58.decode(encoded)
  if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('DID key is not Ed25519 — expected multicodec prefix 0xed 0x01')
  }
  return decoded.slice(2)
}

export function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array(2 + publicKey.length)
  prefixed.set(ED25519_PREFIX, 0)
  prefixed.set(publicKey, 2)
  return `did:key:z${base58.encode(prefixed)}`
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test src/lib/__tests__/did.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/did.ts src/lib/__tests__/did.test.ts
git commit -m "feat: add did:key parsing utilities"
```

---

## Task 4: Handle Generation

**Files:**
- Create: `src/lib/handle.ts`
- Create: `src/lib/__tests__/handle.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/handle.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateHandle, isValidHandle } from '../handle'

describe('generateHandle', () => {
  it('returns adverb-adjective-noun pattern', () => {
    const handle = generateHandle()
    expect(handle).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
    expect(handle.split('-')).toHaveLength(3)
  })

  it('generates different handles on repeated calls (probabilistic)', () => {
    const handles = new Set(Array.from({ length: 20 }, generateHandle))
    expect(handles.size).toBeGreaterThan(1)
  })
})

describe('isValidHandle', () => {
  it('accepts valid handles', () => {
    expect(isValidHandle('swiftly-golden-fox')).toBe(true)
    expect(isValidHandle('boldly-brave-crane')).toBe(true)
  })

  it('rejects handles with wrong structure', () => {
    expect(isValidHandle('one-two')).toBe(false)
    expect(isValidHandle('one-two-three-four')).toBe(false)
    expect(isValidHandle('UPPER-case-fox')).toBe(false)
    expect(isValidHandle('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test src/lib/__tests__/handle.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `src/lib/handle.ts`**

```typescript
const ADVERBS = [
  'boldly', 'bravely', 'calmly', 'cleverly', 'deeply',
  'fiercely', 'freely', 'gently', 'gladly', 'keenly',
  'kindly', 'nimbly', 'proudly', 'purely', 'quietly',
  'sharply', 'silently', 'softly', 'swiftly', 'truly',
  'warmly', 'wisely',
]

const ADJECTIVES = [
  'amber', 'azure', 'bold', 'brave', 'bright',
  'calm', 'clever', 'crimson', 'emerald', 'fierce',
  'gentle', 'golden', 'jade', 'keen', 'nimble',
  'noble', 'quiet', 'sapphire', 'sharp', 'silent',
  'silver', 'swift', 'warm', 'wild', 'wise',
]

const NOUNS = [
  'bear', 'crane', 'deer', 'dove', 'eagle',
  'falcon', 'finch', 'fox', 'hawk', 'heron',
  'kite', 'lark', 'lion', 'lynx', 'martin',
  'otter', 'owl', 'raven', 'stag', 'swan',
  'tiger', 'wolf', 'wren',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateHandle(): string {
  return `${pick(ADVERBS)}-${pick(ADJECTIVES)}-${pick(NOUNS)}`
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(handle)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test src/lib/__tests__/handle.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/handle.ts src/lib/__tests__/handle.test.ts
git commit -m "feat: add adverb-adjective-noun handle generation"
```

---

## Task 5: Server Keypair + JWT Utilities

**Files:**
- Create: `src/lib/server-keys.ts`
- Create: `src/lib/jwt.ts`
- Create: `src/lib/__tests__/jwt.test.ts`

- [ ] **Step 1: Create `src/lib/server-keys.ts`**

```typescript
import { generateKeyPair, exportJWK, importJWK, type KeyLike } from 'jose'

type ServerKeys = { privateKey: KeyLike; publicKeyJwk: JsonWebKey }

let cached: ServerKeys | null = null

export async function getServerKeys(): Promise<ServerKeys> {
  if (cached) return cached

  if (process.env.SERVER_PRIVATE_KEY) {
    const jwk = JSON.parse(
      Buffer.from(process.env.SERVER_PRIVATE_KEY, 'base64').toString('utf-8')
    )
    const privateKey = await importJWK(jwk, 'EdDSA')
    const { d: _d, ...publicKeyJwk } = jwk
    cached = { privateKey, publicKeyJwk: { ...publicKeyJwk, key_ops: ['verify'] } }
  } else {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA')
    const publicKeyJwk = await exportJWK(publicKey)
    cached = { privateKey, publicKeyJwk: { ...publicKeyJwk, alg: 'EdDSA', use: 'sig' } }
  }

  return cached
}
```

- [ ] **Step 2: Write failing tests for JWT**

Create `src/lib/__tests__/jwt.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { signPassportToken, decodePassportToken } from '../jwt'

describe('signPassportToken', () => {
  it('returns a signed JWT and ISO expiresAt', async () => {
    const { token, expiresAt } = await signPassportToken(
      'did:key:z6Mk123',
      'swiftly-golden-fox',
      true
    )
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('decodePassportToken', () => {
  it('round-trips: sign then decode yields same claims', async () => {
    const did = 'did:key:z6Mk456'
    const handle = 'quietly-brave-crane'
    const { token } = await signPassportToken(did, handle, false)
    const payload = await decodePassportToken(token)
    expect(payload.sub).toBe(did)
    expect(payload.handle).toBe(handle)
    expect(payload.claimed).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests — expect failure**

```bash
pnpm test src/lib/__tests__/jwt.test.ts
```

Expected: FAIL

- [ ] **Step 4: Create `src/lib/jwt.ts`**

```typescript
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { randomUUID } from 'crypto'
import { getServerKeys } from './server-keys'

const TOKEN_TTL_SECONDS = 3600

export interface PassportTokenPayload extends JWTPayload {
  handle: string
  claimed: boolean
}

function getIssuer(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
}

export async function signPassportToken(
  did: string,
  handle: string,
  claimed: boolean
): Promise<{ token: string; expiresAt: string }> {
  const { privateKey } = await getServerKeys()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_SECONDS

  const token = await new SignJWT({ handle, claimed })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'passport-v1' })
    .setIssuer(getIssuer())
    .setSubject(did)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(randomUUID())
    .sign(privateKey)

  return { token, expiresAt: new Date(exp * 1000).toISOString() }
}

export async function decodePassportToken(token: string): Promise<PassportTokenPayload> {
  const { getServerKeys: _k } = await import('./server-keys')
  const { publicKeyJwk } = await getServerKeys()
  const { importJWK, jwtVerify } = await import('jose')
  const publicKey = await importJWK(publicKeyJwk, 'EdDSA')
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: getIssuer(),
    algorithms: ['EdDSA'],
  })
  return payload as PassportTokenPayload
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pnpm test src/lib/__tests__/jwt.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server-keys.ts src/lib/jwt.ts src/lib/__tests__/jwt.test.ts
git commit -m "feat: server keypair management and JWT signing"
```

---

## Task 6: JWKS Endpoint

**Files:**
- Create: `src/app/.well-known/jwks.json/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextResponse } from 'next/server'
import { getServerKeys } from '@/lib/server-keys'

export async function GET() {
  const { publicKeyJwk } = await getServerKeys()
  return NextResponse.json({
    keys: [{ ...publicKeyJwk, kid: 'passport-v1', use: 'sig', alg: 'EdDSA' }],
  })
}
```

- [ ] **Step 2: Start dev server and verify**

```bash
pnpm dev &
sleep 3
curl -s http://localhost:3000/.well-known/jwks.json | jq .
```

Expected output:
```json
{
  "keys": [
    {
      "kty": "OKP",
      "crv": "Ed25519",
      "kid": "passport-v1",
      "use": "sig",
      "alg": "EdDSA",
      "x": "<base64url string>"
    }
  ]
}
```

- [ ] **Step 3: Kill dev server and commit**

```bash
kill %1
git add src/app/.well-known/
git commit -m "feat: add JWKS endpoint at /.well-known/jwks.json"
```

---

## Task 7: Update Register Endpoint

**Files:**
- Modify: `src/app/api/passport/register/route.ts`
- Modify: `src/lib/email.ts`
- Modify: `src/types/passport.ts`

- [ ] **Step 1: Update types in `src/types/passport.ts`**

```typescript
export type PassportStatus = 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'

export interface PassportSummary {
  did: string
  handle: string
  name: string | null
  status: PassportStatus
  createdAt: string
}

export interface PassportDetail {
  did: string
  handle: string
  publicKey: string
  status: PassportStatus
  ownerEmail: string | null
  name: string | null
  description: string | null
  createdAt: string
  claimedAt: string | null
}
```

- [ ] **Step 2: Update `src/lib/email.ts`**

Replace the `passportId` parameter with `handle`:

```typescript
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendClaimEmail(
  to: string,
  handle: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const magicLink = `${baseUrl}/claim?token=${token}`

  if (!resend) {
    console.log(`\n[DEV] Claim link for ${handle}:\n${magicLink}\n`)
    return
  }

  await resend.emails.send({
    from: 'passport@yourdomain.com',
    to,
    subject: `Claim your agent passport: ${handle}`,
    html: `
      <p>An agent has been registered with your email as owner.</p>
      <p><strong>Handle:</strong> ${handle}</p>
      <p>Click to confirm ownership (expires in 24 hours):</p>
      <p><a href="${magicLink}">${magicLink}</a></p>
    `,
  })
}
```

- [ ] **Step 3: Rewrite `src/app/api/passport/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClaimToken, hashToken } from '@/lib/crypto'
import { sendClaimEmail } from '@/lib/email'
import { extractPublicKeyFromDid } from '@/lib/did'
import { generateHandle } from '@/lib/handle'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { did, ownerEmail, name, description } = body

  if (!did) {
    return NextResponse.json({ error: 'did is required' }, { status: 400 })
  }

  let publicKeyBytes: Uint8Array
  try {
    publicKeyBytes = extractPublicKeyFromDid(did)
  } catch {
    return NextResponse.json({ error: 'invalid_did' }, { status: 400 })
  }

  const existing = await prisma.passport.findUnique({ where: { did } })
  if (existing) {
    return NextResponse.json({ error: 'did_already_registered' }, { status: 409 })
  }

  // Generate a unique handle (retry up to 10 times on collision)
  let handle: string | null = null
  for (let i = 0; i < 10; i++) {
    const candidate = generateHandle()
    const taken = await prisma.passport.findUnique({ where: { handle: candidate } })
    if (!taken) { handle = candidate; break }
  }
  if (!handle) {
    return NextResponse.json({ error: 'Could not generate unique handle' }, { status: 500 })
  }

  const publicKey = Buffer.from(publicKeyBytes).toString('base64url')

  const passport = await prisma.passport.create({
    data: {
      did,
      handle,
      publicKey,
      ownerEmail: ownerEmail ?? null,
      name: name ?? null,
      description: description ?? null,
    },
  })

  if (ownerEmail) {
    const rawToken = generateClaimToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.claimToken.create({
      data: { token: tokenHash, did, email: ownerEmail, expiresAt },
    })

    const baseUrl = request.headers.get('origin') ?? 'http://localhost:3000'
    await sendClaimEmail(ownerEmail, handle, rawToken, baseUrl)

    // In development, return raw token so the demo can claim without email
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { did: passport.did, handle: passport.handle, status: 'UNCLAIMED', _devClaimToken: rawToken },
        { status: 201 }
      )
    }
  }

  return NextResponse.json(
    { did: passport.did, handle: passport.handle, status: 'UNCLAIMED' },
    { status: 201 }
  )
}
```

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: all tests PASS (register endpoint has no unit tests yet, but existing tests should not break).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/passport/register/route.ts src/lib/email.ts src/types/passport.ts
git commit -m "feat: update register endpoint — accepts did, auto-generates handle"
```

---

## Task 8: Update Claim Endpoint

**Files:**
- Modify: `src/app/api/passport/claim/route.ts`

The claim logic is mostly the same — just field names changed (`passportId` → `did`).

- [ ] **Step 1: Update `src/app/api/passport/claim/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  const { token } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const tokenHash = hashToken(token)
  const claimToken = await prisma.claimToken.findUnique({
    where: { token: tokenHash },
    include: { passport: true },
  })

  if (!claimToken) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  if (claimToken.usedAt) {
    return NextResponse.json({ error: 'token_already_used' }, { status: 400 })
  }
  if (claimToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'token_expired' }, { status: 400 })
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.passport.update({
      where: { did: claimToken.did },
      data: { status: 'CLAIMED', claimedAt: now },
    }),
    prisma.claimToken.update({
      where: { token: tokenHash },
      data: { usedAt: now },
    }),
  ])

  return NextResponse.json({
    did: claimToken.did,
    handle: claimToken.passport.handle,
    status: 'CLAIMED',
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/passport/claim/route.ts
git commit -m "feat: update claim endpoint for new schema"
```

---

## Task 9: Challenge Endpoint

**Files:**
- Create: `src/app/api/passport/challenge/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { did } = body

  if (!did) {
    return NextResponse.json({ error: 'did is required' }, { status: 400 })
  }

  const passport = await prisma.passport.findUnique({ where: { did } })
  if (!passport) {
    return NextResponse.json({ error: 'passport_not_found' }, { status: 404 })
  }
  if (passport.status === 'REVOKED') {
    return NextResponse.json({ error: 'passport_revoked' }, { status: 403 })
  }

  const nonce = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await prisma.nonce.create({ data: { did, nonce, expiresAt } })

  return NextResponse.json({ nonce, expiresAt: expiresAt.toISOString() })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/passport/challenge/route.ts
git commit -m "feat: add challenge endpoint for Ed25519 challenge-response"
```

---

## Task 10: Token Endpoint

**Files:**
- Create: `src/app/api/passport/token/route.ts`

This is the critical path: verify Ed25519 signature → issue JWT.

- [ ] **Step 1: Create route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signPassportToken } from '@/lib/jwt'
import { extractPublicKeyFromDid } from '@/lib/did'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { did, nonce, signature } = body

  if (!did || !nonce || !signature) {
    return NextResponse.json(
      { error: 'did, nonce, and signature are required' },
      { status: 400 }
    )
  }

  // Validate nonce
  const nonceRecord = await prisma.nonce.findUnique({ where: { nonce } })

  if (!nonceRecord || nonceRecord.did !== did) {
    return NextResponse.json({ error: 'invalid_nonce' }, { status: 400 })
  }
  if (nonceRecord.usedAt) {
    return NextResponse.json({ error: 'nonce_already_used' }, { status: 400 })
  }
  if (nonceRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: 'nonce_expired' }, { status: 400 })
  }

  // Verify Ed25519 signature
  let publicKeyBytes: Uint8Array
  try {
    publicKeyBytes = extractPublicKeyFromDid(did)
  } catch {
    return NextResponse.json({ error: 'invalid_did' }, { status: 400 })
  }

  const nonceBytes = Buffer.from(nonce, 'hex')
  const sigBytes = Buffer.from(signature, 'base64')
  const valid = await verifyEd25519(publicKeyBytes, nonceBytes, sigBytes)

  if (!valid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  // Consume nonce
  await prisma.nonce.update({ where: { nonce }, data: { usedAt: new Date() } })

  // Issue token
  const passport = await prisma.passport.findUniqueOrThrow({ where: { did } })
  const { token, expiresAt } = await signPassportToken(
    did,
    passport.handle,
    passport.status === 'CLAIMED'
  )

  return NextResponse.json({ token, expiresAt })
}

async function verifyEd25519(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      publicKey,
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, signature, message)
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/passport/token/route.ts
git commit -m "feat: add token endpoint — verify Ed25519 sig, issue JWT"
```

---

## Task 11: Passport Lookup Endpoint

**Files:**
- Delete: `src/app/api/passport/[id]/route.ts`
- Create: `src/app/api/passport/[handle]/route.ts`
- Modify: `src/app/api/passport/route.ts`

- [ ] **Step 1: Delete old `[id]` route**

```bash
rm src/app/api/passport/[id]/route.ts
rmdir src/app/api/passport/[id]
```

- [ ] **Step 2: Create `src/app/api/passport/[handle]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import type { PassportDetail } from '@/types/passport'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const passport = await prisma.passport.findUnique({ where: { handle } })

  if (!passport) {
    return NextResponse.json({ error: 'passport_not_found' }, { status: 404 })
  }

  const result: PassportDetail = {
    did: passport.did,
    handle: passport.handle,
    publicKey: passport.publicKey,
    status: passport.status as PassportDetail['status'],
    ownerEmail: passport.ownerEmail ? maskEmail(passport.ownerEmail) : null,
    name: passport.name,
    description: passport.description,
    createdAt: passport.createdAt.toISOString(),
    claimedAt: passport.claimedAt?.toISOString() ?? null,
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 3: Update `src/app/api/passport/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import type { PassportSummary } from '@/types/passport'

export async function GET() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { did: true, handle: true, name: true, status: true, createdAt: true, ownerEmail: true },
  })

  const result: PassportSummary[] = passports.map((p) => ({
    did: p.did,
    handle: p.handle,
    name: p.name,
    status: p.status as PassportSummary['status'],
    createdAt: p.createdAt.toISOString(),
    ownerEmail: p.ownerEmail ? maskEmail(p.ownerEmail) : null,
  }))

  return NextResponse.json(result)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/passport/
git commit -m "feat: passport lookup by handle, update registry list"
```

---

## Task 12: Demo Page

**Files:**
- Create: `src/app/demo/page.tsx`
- Create: `src/components/demo-flow.tsx`

The demo walks through the full agent flow interactively in the browser: generate keypair → register → claim → get challenge → sign → exchange for token → verify via JWKS.

- [ ] **Step 1: Create `src/app/demo/page.tsx`**

```tsx
import { DemoFlow } from '@/components/demo-flow'

export default function DemoPage() {
  return (
    <div className="space-y-8">
      <section className="demo-panel p-8 sm:p-10">
        <p className="eyebrow">Live demo</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Agent identity in action.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground max-w-2xl">
          This demo runs entirely in your browser. Your private key is generated locally and never sent to the server — only a signature over a nonce is transmitted.
        </p>
      </section>
      <DemoFlow />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/demo-flow.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// @noble/ed25519 requires sha512 to be set for browser use
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import { base58 } from '@scure/base'

ed.etc.sha512Sync = (...msgs: Uint8Array[]) =>
  sha512(ed.etc.concatBytes(...msgs))

function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array([0xed, 0x01, ...publicKey])
  return `did:key:z${base58.encode(prefixed)}`
}

type Step = 'idle' | 'generated' | 'registered' | 'claimed' | 'challenged' | 'tokenized' | 'verified'

interface State {
  step: Step
  privateKey?: Uint8Array
  publicKey?: Uint8Array
  did?: string
  handle?: string
  claimToken?: string
  nonce?: string
  token?: string
  tokenPayload?: Record<string, unknown>
  jwksKey?: Record<string, unknown>
  error?: string
  log: string[]
}

export function DemoFlow() {
  const [state, setState] = useState<State>({ step: 'idle', log: [] })

  function addLog(msg: string) {
    setState(s => ({ ...s, log: [...s.log, msg] }))
  }

  function setError(error: string) {
    setState(s => ({ ...s, error }))
  }

  async function generateKeypair() {
    setState(s => ({ ...s, error: undefined }))
    const privateKey = ed.utils.randomPrivateKey()
    const publicKey = await ed.getPublicKeyAsync(privateKey)
    const did = didFromPublicKey(publicKey)
    setState(s => ({
      ...s,
      step: 'generated',
      privateKey,
      publicKey,
      did,
      log: [...s.log, `Generated Ed25519 keypair`, `DID: ${did.slice(0, 40)}...`],
    }))
  }

  async function register() {
    if (!state.did) return
    setState(s => ({ ...s, error: undefined }))
    try {
      const res = await fetch('/api/passport/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did, name: 'Demo Agent' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({
        ...s,
        step: 'registered',
        handle: data.handle,
        claimToken: data._devClaimToken,
        log: [...s.log, `Registered as: ${data.handle}`, `Status: ${data.status}`],
      }))
    } catch (e) {
      setError(String(e))
    }
  }

  async function claim() {
    if (!state.claimToken) {
      addLog('No claim token (email mode — check server logs)')
      setState(s => ({ ...s, step: 'claimed' }))
      return
    }
    try {
      const res = await fetch('/api/passport/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.claimToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({
        ...s,
        step: 'claimed',
        log: [...s.log, `Claimed passport — status: ${data.status}`],
      }))
    } catch (e) {
      setError(String(e))
    }
  }

  async function challenge() {
    if (!state.did) return
    try {
      const res = await fetch('/api/passport/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({
        ...s,
        step: 'challenged',
        nonce: data.nonce,
        log: [...s.log, `Got nonce: ${data.nonce.slice(0, 16)}... (expires ${data.expiresAt})`],
      }))
    } catch (e) {
      setError(String(e))
    }
  }

  async function getToken() {
    if (!state.did || !state.nonce || !state.privateKey) return
    try {
      const nonceBytes = Buffer.from(state.nonce, 'hex')
      const signature = await ed.signAsync(nonceBytes, state.privateKey)
      const signatureB64 = Buffer.from(signature).toString('base64')
      addLog(`Signed nonce with private key`)

      const res = await fetch('/api/passport/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did, nonce: state.nonce, signature: signatureB64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Decode payload (middle part of JWT)
      const payloadB64 = data.token.split('.')[1]
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

      setState(s => ({
        ...s,
        step: 'tokenized',
        token: data.token,
        tokenPayload: payload,
        log: [...s.log, `Token issued (expires ${data.expiresAt})`],
      }))
    } catch (e) {
      setError(String(e))
    }
  }

  async function verifyViaJwks() {
    if (!state.token) return
    try {
      const jwksRes = await fetch('/.well-known/jwks.json')
      const jwks = await jwksRes.json()
      const key = jwks.keys[0]

      // Import the public key from JWKS
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        key,
        { name: 'Ed25519' },
        false,
        ['verify']
      )

      // Verify the JWT signature manually
      const [headerB64, payloadB64, sigB64] = state.token.split('.')
      const signingInput = `${headerB64}.${payloadB64}`
      const sigBytes = Uint8Array.from(
        atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      )
      const msgBytes = new TextEncoder().encode(signingInput)

      const valid = await crypto.subtle.verify({ name: 'Ed25519' }, cryptoKey, sigBytes, msgBytes)

      setState(s => ({
        ...s,
        step: 'verified',
        jwksKey: key,
        log: [...s.log, `Fetched JWKS from /.well-known/jwks.json`, `Signature valid: ${valid}`],
      }))
    } catch (e) {
      setError(String(e))
    }
  }

  const steps: { id: Step | 'registered' | 'claimed'; label: string; action: () => void; disabled: boolean; buttonLabel: string }[] = [
    { id: 'generated', label: '1. Generate keypair', action: generateKeypair, disabled: false, buttonLabel: 'Generate' },
    { id: 'registered', label: '2. Register DID', action: register, disabled: state.step === 'idle', buttonLabel: 'Register' },
    { id: 'claimed', label: '3. Claim passport', action: claim, disabled: state.step !== 'registered', buttonLabel: 'Claim' },
    { id: 'challenged', label: '4. Request challenge', action: challenge, disabled: state.step !== 'claimed', buttonLabel: 'Get nonce' },
    { id: 'tokenized', label: '5. Sign & get token', action: getToken, disabled: state.step !== 'challenged', buttonLabel: 'Sign & exchange' },
    { id: 'verified', label: '6. Verify via JWKS', action: verifyViaJwks, disabled: state.step !== 'tokenized', buttonLabel: 'Verify' },
  ]

  const stepOrder: Step[] = ['idle', 'generated', 'registered', 'claimed', 'challenged', 'tokenized', 'verified']
  const currentIdx = stepOrder.indexOf(state.step)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((s, i) => {
          const done = currentIdx > i
          const active = stepOrder[currentIdx] === s.id
          return (
            <div key={s.id} className="flex items-center gap-4 rounded-lg border p-4">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${done ? 'bg-green-500 text-white' : active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                {active && state.handle && i === 1 && (
                  <p className="text-xs text-muted-foreground mt-0.5">handle: {state.handle}</p>
                )}
              </div>
              {!done && (
                <Button size="sm" onClick={s.action} disabled={s.disabled}>
                  {s.buttonLabel}
                </Button>
              )}
              {done && <Badge variant="outline" className="text-green-600 border-green-300">Done</Badge>}
            </div>
          )
        })}
      </div>

      {/* Log + Token */}
      <div className="space-y-4">
        {/* Activity log */}
        <div className="rounded-lg border bg-zinc-950 p-4 font-mono text-xs text-zinc-300 min-h-[160px]">
          {state.log.length === 0 && <span className="text-zinc-600">Waiting for first step…</span>}
          {state.log.map((line, i) => (
            <div key={i} className="leading-6">
              <span className="text-zinc-600 mr-2">{'>'}</span>{line}
            </div>
          ))}
          {state.error && (
            <div className="mt-2 text-red-400">Error: {state.error}</div>
          )}
        </div>

        {/* Token payload */}
        {state.tokenPayload && (
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">JWT Payload</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(state.tokenPayload, null, 2)}</pre>
          </div>
        )}

        {/* JWKS key */}
        {state.jwksKey && (
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">JWKS Public Key (registry)</p>
            <pre className="text-xs overflow-auto">{JSON.stringify(state.jwksKey, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add demo link to nav (optional — update `src/app/page.tsx` or layout)**

In `src/app/page.tsx`, add a link to `/demo`:
```tsx
<Link href="/demo">Live Demo</Link>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/demo/ src/components/demo-flow.tsx
git commit -m "feat: add interactive demo page showing full agent auth flow"
```

---

## Task 13: Update Init Form

**Files:**
- Modify: `src/components/init-form.tsx`

The init form currently posts `agentId` and `publicKey` separately. Update it to post a `did` generated from the keypair.

- [ ] **Step 1: Read current `src/components/init-form.tsx` and update the register call**

Find the `fetch('/api/passport/register', ...)` call in init-form.tsx and change the body from:
```typescript
{ agentId, publicKey, ownerEmail, name }
```
to:
```typescript
{ did, ownerEmail, name }
```
where `did` is computed as `didFromPublicKey(publicKeyBytes)` using the same `didFromPublicKey` helper from `@scure/base` + `@noble/ed25519`.

Import at top of the file:
```typescript
import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import { base58 } from '@scure/base'
ed.etc.sha512Sync = (...msgs: Uint8Array[]) => sha512(ed.etc.concatBytes(...msgs))

function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array([0xed, 0x01, ...publicKey])
  return `did:key:z${base58.encode(prefixed)}`
}
```

Update the form's submit handler so that:
1. It generates a private key: `const privateKey = ed.utils.randomPrivateKey()`
2. Gets public key: `const publicKey = await ed.getPublicKeyAsync(privateKey)`
3. Builds DID: `const did = didFromPublicKey(publicKey)`
4. Stores private key in localStorage (for demo continuity): `localStorage.setItem('passport_private_key', Buffer.from(privateKey).toString('hex'))`
5. Posts `{ did, ownerEmail, name }` to `/api/passport/register`

- [ ] **Step 2: Run dev server and test the init form end-to-end**

```bash
pnpm dev
```

Open http://localhost:3000/init, fill in email and name, submit. Check server logs for the claim link. Open the link. Verify the passport shows as CLAIMED at `/api/passport/:handle`.

- [ ] **Step 3: Commit**

```bash
git add src/components/init-form.tsx
git commit -m "feat: update init form to generate DID and use new register API"
```

---

## Final Verification

- [ ] Run full test suite: `pnpm test` — all pass
- [ ] Run `pnpm build` — no TypeScript errors
- [ ] Smoke test the full demo flow at http://localhost:3000/demo
- [ ] Verify JWKS at http://localhost:3000/.well-known/jwks.json
- [ ] Verify registry at http://localhost:3000/api/passport

```bash
# Quick smoke test via curl (replace handle with actual value from demo)
curl -X POST http://localhost:3000/api/passport/challenge \
  -H 'Content-Type: application/json' \
  -d '{"did":"did:key:YOUR_DID_HERE"}'
```

- [ ] Final commit

```bash
git add -A
git commit -m "chore: agent passport v0.1 complete — DID identity, challenge-response, JWKS"
```
