# Agent Passport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 web app where agents self-initialize Ed25519 keypairs in the browser, register their public keys with a server IDP, and human owners claim them via email magic link.

**Architecture:** Single Next.js 15 (App Router) app — server components for data display, client components for crypto and form interactions, API routes for mutations. SQLite via Prisma for persistence, Resend for email with console fallback in dev.

**Tech Stack:** Next.js 15, TypeScript, Prisma + SQLite, shadcn/ui, Tailwind CSS, Resend, Web Crypto API, Vitest

---

## File Map

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Passport and ClaimToken data models |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/crypto.ts` | Token generation + SHA-256 hashing (server-side, Node.js crypto) |
| `src/lib/mask.ts` | Email masking utility |
| `src/lib/email.ts` | Resend / console email sender |
| `src/types/passport.ts` | Shared TypeScript types |
| `src/app/api/passport/route.ts` | GET /api/passport — list all |
| `src/app/api/passport/register/route.ts` | POST /api/passport/register |
| `src/app/api/passport/[id]/route.ts` | GET /api/passport/[id] |
| `src/app/api/passport/claim/route.ts` | POST /api/passport/claim |
| `src/components/status-badge.tsx` | Status badge (UNCLAIMED / CLAIMED / REVOKED) |
| `src/components/init-form.tsx` | Client component — keygen + register form |
| `src/components/claim-button.tsx` | Client component — confirm ownership button |
| `src/app/layout.tsx` | Root layout with nav |
| `src/app/page.tsx` | Registry — table of all passports |
| `src/app/init/page.tsx` | Init page — wraps InitForm |
| `src/app/passport/[id]/page.tsx` | Passport card detail |
| `src/app/claim/page.tsx` | Claim landing — server component |

---

## Task 1: Bootstrap Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts` (via create-next-app)
- Create: `vitest.config.ts`
- Create: `.env`, `.env.example`

- [ ] **Step 1: Scaffold with create-next-app**

Run from `/Users/mbajaj/src/for-agents/passport`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
When prompted about Turbopack, choose Yes or No (either works).

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @prisma/client resend
npm install -D prisma vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
Accept defaults (New York style, zinc color).

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add badge button card input label table textarea
```

- [ ] **Step 5: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 7: Create .env and .env.example**

`.env`:
```
DATABASE_URL="file:./dev.db"
RESEND_API_KEY=""
```

`.env.example`:
```
DATABASE_URL="file:./dev.db"
RESEND_API_KEY=""
```

- [ ] **Step 8: Verify setup**

```bash
npm run dev
```

Expected: Next.js dev server starts at http://localhost:3000. Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js 15 project with shadcn, Prisma, Vitest"
```

---

## Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/migrations/` (auto-generated)

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

Expected: creates `prisma/schema.prisma`, confirms `DATABASE_URL` in `.env`.

- [ ] **Step 2: Write schema**

Replace the entire contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Passport {
  id          String         @id
  publicKey   String
  status      PassportStatus @default(UNCLAIMED)
  ownerEmail  String?
  name        String?
  description String?
  tags        Json?
  createdAt   DateTime       @default(now())
  claimedAt   DateTime?
  claimTokens ClaimToken[]
}

model ClaimToken {
  token      String    @id
  passportId String
  email      String
  expiresAt  DateTime
  usedAt     DateTime?
  passport   Passport  @relation(fields: [passportId], references: [id])
}

enum PassportStatus {
  UNCLAIMED
  CLAIMED
  REVOKED
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied...
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add Prisma schema with Passport and ClaimToken models"
```

---

## Task 3: Server Utilities

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `src/lib/mask.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/email.ts`
- Create: `src/types/passport.ts`
- Create: `src/__tests__/crypto.test.ts`
- Create: `src/__tests__/mask.test.ts`

- [ ] **Step 1: Write failing tests for crypto utilities**

Create `src/__tests__/crypto.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateClaimToken, hashToken } from '@/lib/crypto'

describe('generateClaimToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateClaimToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns unique values on each call', () => {
    expect(generateClaimToken()).not.toBe(generateClaimToken())
  })
})

describe('hashToken', () => {
  it('returns a 64-character hex SHA-256 string', () => {
    expect(hashToken('test')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
  })

  it('different inputs produce different hashes', () => {
    expect(hashToken('abc')).not.toBe(hashToken('def'))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: `FAIL — Cannot find module '@/lib/crypto'`

- [ ] **Step 3: Implement crypto.ts**

Create `src/lib/crypto.ts`:
```ts
import { createHash, randomBytes } from 'crypto'

export function generateClaimToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: `✓ crypto.test.ts (5 tests)`

- [ ] **Step 5: Write failing tests for mask utility**

Create `src/__tests__/mask.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { maskEmail } from '@/lib/mask'

describe('maskEmail', () => {
  it('masks local part keeping first character', () => {
    expect(maskEmail('manoj@ruzo.ai')).toBe('m***@ruzo.ai')
  })

  it('preserves full domain', () => {
    expect(maskEmail('alice@example.com')).toBe('a***@example.com')
  })

  it('handles single-char local part', () => {
    expect(maskEmail('a@b.com')).toBe('a***@b.com')
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npm test
```

Expected: `FAIL — Cannot find module '@/lib/mask'`

- [ ] **Step 7: Implement mask.ts**

Create `src/lib/mask.ts`:
```ts
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@')
  if (atIndex <= 0) return email
  return `${email[0]}***${email.slice(atIndex)}`
}
```

- [ ] **Step 8: Run all tests**

```bash
npm test
```

Expected: `✓ crypto.test.ts (5 tests)   ✓ mask.test.ts (3 tests)`

- [ ] **Step 9: Create Prisma singleton**

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 10: Create email sender**

Create `src/lib/email.ts`:
```ts
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendClaimEmail(
  to: string,
  passportId: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const magicLink = `${baseUrl}/claim?token=${token}`

  if (!resend) {
    console.log(`\n[DEV] Magic link for ${passportId}:\n${magicLink}\n`)
    return
  }

  await resend.emails.send({
    from: 'passport@yourdomain.com',
    to,
    subject: `Claim your agent passport: ${passportId}`,
    html: `
      <p>An agent has been registered with your email as owner.</p>
      <p><strong>Agent ID:</strong> ${passportId}</p>
      <p>Click to confirm ownership (expires in 24 hours):</p>
      <p><a href="${magicLink}">${magicLink}</a></p>
    `,
  })
}
```

- [ ] **Step 11: Create shared types**

Create `src/types/passport.ts`:
```ts
export type PassportStatus = 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'

export interface PassportSummary {
  id: string
  name: string | null
  status: PassportStatus
  createdAt: string
  ownerEmail: string | null
}

export interface PassportDetail {
  id: string
  publicKey: string
  status: PassportStatus
  ownerEmail: string | null
  name: string | null
  description: string | null
  tags: Record<string, string> | null
  createdAt: string
  claimedAt: string | null
}
```

- [ ] **Step 12: Commit**

```bash
git add src/lib/ src/types/ src/__tests__/
git commit -m "feat: add server utilities (crypto, mask, email, prisma) with tests"
```

---

## Task 4: API Route — List Passports

**Files:**
- Create: `src/app/api/passport/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/passport/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import type { PassportSummary } from '@/types/passport'

export async function GET() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true, ownerEmail: true },
  })

  const result: PassportSummary[] = passports.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status as PassportSummary['status'],
    createdAt: p.createdAt.toISOString(),
    ownerEmail: p.ownerEmail ? maskEmail(p.ownerEmail) : null,
  }))

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Test with curl (dev server running)**

```bash
curl http://localhost:3000/api/passport
```

Expected: `[]`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/passport/route.ts
git commit -m "feat: add GET /api/passport endpoint"
```

---

## Task 5: API Route — Register Passport

**Files:**
- Create: `src/app/api/passport/register/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/passport/register/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClaimToken, hashToken } from '@/lib/crypto'
import { sendClaimEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { agentId, publicKey, ownerEmail, name, description, tags } = body

  if (!agentId || !publicKey || !ownerEmail) {
    return NextResponse.json(
      { error: 'agentId, publicKey, and ownerEmail are required' },
      { status: 400 }
    )
  }

  if (!/^agnt_[0-9a-f]{16}$/.test(agentId)) {
    return NextResponse.json({ error: 'Invalid agentId format' }, { status: 400 })
  }

  const existing = await prisma.passport.findUnique({ where: { id: agentId } })
  if (existing) {
    return NextResponse.json({ error: 'Agent ID already registered' }, { status: 409 })
  }

  const rawToken = generateClaimToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.passport.create({
    data: {
      id: agentId,
      publicKey,
      ownerEmail,
      name: name ?? null,
      description: description ?? null,
      tags: tags ?? null,
      claimTokens: {
        create: { token: tokenHash, email: ownerEmail, expiresAt },
      },
    },
  })

  const baseUrl = request.headers.get('origin') ?? 'http://localhost:3000'
  await sendClaimEmail(ownerEmail, agentId, rawToken, baseUrl)

  return NextResponse.json({ passportId: agentId, status: 'UNCLAIMED' }, { status: 201 })
}
```

- [ ] **Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/passport/register \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agnt_aabbccdd11223344","publicKey":"dGVzdHB1YmxpY2tleQ==","ownerEmail":"test@example.com","name":"Test Agent"}'
```

Expected response:
```json
{"passportId":"agnt_aabbccdd11223344","status":"UNCLAIMED"}
```

Expected in server console:
```
[DEV] Magic link for agnt_aabbccdd11223344:
http://localhost:3000/claim?token=<64-char-hex>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/passport/register/
git commit -m "feat: add POST /api/passport/register endpoint"
```

---

## Task 6: API Route — Get Passport by ID

**Files:**
- Create: `src/app/api/passport/[id]/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/passport/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import type { PassportDetail } from '@/types/passport'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const passport = await prisma.passport.findUnique({ where: { id } })

  if (!passport) {
    return NextResponse.json({ error: 'Passport not found' }, { status: 404 })
  }

  const result: PassportDetail = {
    id: passport.id,
    publicKey: passport.publicKey,
    status: passport.status as PassportDetail['status'],
    ownerEmail: passport.ownerEmail ? maskEmail(passport.ownerEmail) : null,
    name: passport.name,
    description: passport.description,
    tags: passport.tags as Record<string, string> | null,
    createdAt: passport.createdAt.toISOString(),
    claimedAt: passport.claimedAt?.toISOString() ?? null,
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Test with curl**

```bash
curl http://localhost:3000/api/passport/agnt_aabbccdd11223344
```

Expected: full passport JSON with masked ownerEmail (`t***@example.com`)

```bash
curl http://localhost:3000/api/passport/agnt_doesnotexist
```

Expected: `{"error":"Passport not found"}` with status 404

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/passport/[id]/"
git commit -m "feat: add GET /api/passport/[id] endpoint"
```

---

## Task 7: API Route — Claim Passport

**Files:**
- Create: `src/app/api/passport/claim/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/passport/claim/route.ts`:
```ts
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
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (claimToken.usedAt) {
    return NextResponse.json({ error: 'Token already used' }, { status: 400 })
  }

  if (claimToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.passport.update({
      where: { id: claimToken.passportId },
      data: { status: 'CLAIMED', claimedAt: now },
    }),
    prisma.claimToken.update({
      where: { token: tokenHash },
      data: { usedAt: now },
    }),
  ])

  return NextResponse.json({ passportId: claimToken.passportId, status: 'CLAIMED' })
}
```

- [ ] **Step 2: Test with curl**

Copy the token from the console output in Task 5. Replace `<token>`:

```bash
curl -X POST http://localhost:3000/api/passport/claim \
  -H "Content-Type: application/json" \
  -d '{"token":"<64-char-hex-token>"}'
```

Expected: `{"passportId":"agnt_aabbccdd11223344","status":"CLAIMED"}`

Run again with the same token:

Expected: `{"error":"Token already used"}`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/passport/claim/
git commit -m "feat: add POST /api/passport/claim endpoint"
```

---

## Task 8: Status Badge + Layout

**Files:**
- Create: `src/components/status-badge.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create StatusBadge component**

Create `src/components/status-badge.tsx`:
```tsx
import { Badge } from '@/components/ui/badge'
import type { PassportStatus } from '@/types/passport'

const config: Record<PassportStatus, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
  UNCLAIMED: { label: 'Unclaimed', variant: 'secondary' },
  CLAIMED:   { label: 'Claimed',   variant: 'default' },
  REVOKED:   { label: 'Revoked',   variant: 'destructive' },
}

export function StatusBadge({ status }: { status: PassportStatus }) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Agent Passport',
  description: 'Cryptographic identity for AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">Agent Passport</Link>
            <Link href="/init" className="text-sm px-3 py-1 border rounded hover:bg-muted">
              + New Agent
            </Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: http://localhost:3000 shows nav bar with "Agent Passport" and "+ New Agent".

- [ ] **Step 4: Commit**

```bash
git add src/components/status-badge.tsx src/app/layout.tsx
git commit -m "feat: add StatusBadge component and root layout with nav"
```

---

## Task 9: Registry Page (/)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write registry page**

Replace `src/app/page.tsx`:
```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true, ownerEmail: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Registry</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {passports.length} registered agent{passports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/init"><Button>+ Init New Agent</Button></Link>
      </div>

      {passports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No agents registered yet.</p>
          <Link href="/init" className="text-primary underline mt-2 inline-block">
            Register the first one
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {passports.map((p) => (
              <TableRow key={p.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/passport/${p.id}`} className="font-mono text-sm hover:underline">
                    {p.id}
                  </Link>
                </TableCell>
                <TableCell>{p.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status as 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.ownerEmail ? maskEmail(p.ownerEmail) : '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000. Expected: "Agent Registry" heading with either empty state or the test agent from Task 5 showing CLAIMED status.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add registry page listing all passports"
```

---

## Task 10: Init Page (/init)

**Files:**
- Create: `src/components/init-form.tsx`
- Create: `src/app/init/page.tsx`

- [ ] **Step 1: Create InitForm client component**

Create `src/components/init-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'

type Step = 'idle' | 'initialized' | 'success'

interface AgentKeys {
  agentId: string
  publicKey: string
  privateKeyB64: string
}

async function initAgent(): Promise<AgentKeys> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(8))
  const agentId = 'agnt_' + Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  )

  const pubBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(pubBuffer)))

  const privBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privBuffer)))

  return { agentId, publicKey, privateKeyB64 }
}

export function InitForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [keys, setKeys] = useState<AgentKeys | null>(null)
  const [passportId, setPassportId] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInit() {
    setLoading(true)
    try {
      const agentKeys = await initAgent()
      setKeys(agentKeys)
      setStep('initialized')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!keys) return
    setLoading(true)
    setError(null)
    try {
      let parsedTags: Record<string, string> | undefined
      if (tags.trim()) {
        try {
          parsedTags = JSON.parse(tags)
        } catch {
          setError('Tags must be valid JSON, e.g. {"env":"prod"}')
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/passport/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: keys.agentId,
          publicKey: keys.publicKey,
          ownerEmail,
          name: name || undefined,
          description: description || undefined,
          tags: parsedTags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Registration failed')
        return
      }

      const data = await res.json()
      setPassportId(data.passportId)
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'idle') {
    return (
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Step 1 — Init Agent</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generates a unique Agent ID and Ed25519 keypair locally in your browser.
            The private key never leaves this page.
          </p>
          <Button onClick={handleInit} disabled={loading}>
            {loading ? 'Generating...' : 'Init Agent'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'initialized' && keys) {
    return (
      <div className="space-y-6 max-w-lg">
        <Card>
          <CardHeader><CardTitle>Step 1 — Keys Generated</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Agent ID</Label>
              <div className="font-mono text-sm bg-muted px-3 py-2 rounded mt-1 break-all select-all">
                {keys.agentId}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Public Key (Base64)</Label>
              <div className="font-mono text-xs bg-muted px-3 py-2 rounded mt-1 break-all select-all">
                {keys.publicKey}
              </div>
            </div>
            <div className="border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded p-3">
              <Label className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠ Private Key — Save this now
              </Label>
              <div className="font-mono text-xs bg-white dark:bg-black px-3 py-2 rounded mt-2 break-all select-all">
                {keys.privateKeyB64}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                This key never leaves your browser. Copy it before registering.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Step 2 — Register</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name">
                Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Agent"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="tags">
                Tags <span className="text-muted-foreground">(optional JSON, e.g. {`{"env":"prod"}`})</span>
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder='{"env":"prod"}'
                className="mt-1 font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleRegister} disabled={loading || !ownerEmail}>
              {loading ? 'Registering...' : 'Register with IDP'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success' && passportId) {
    return (
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Registered</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm">{passportId}</span>
            <StatusBadge status="UNCLAIMED" />
          </div>
          <p className="text-sm text-muted-foreground">
            A magic link has been sent to <strong>{ownerEmail}</strong>.
            The owner must click it to claim this passport.
          </p>
          <Button variant="outline" onClick={() => router.push(`/passport/${passportId}`)}>
            View Passport
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
```

- [ ] **Step 2: Create init page**

Create `src/app/init/page.tsx`:
```tsx
import { InitForm } from '@/components/init-form'

export default function InitPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Init Agent</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate a cryptographic identity and register it with the IDP.
        </p>
      </div>
      <InitForm />
    </div>
  )
}
```

- [ ] **Step 3: Test in browser**

Navigate to http://localhost:3000/init:
1. Click "Init Agent" — confirm Agent ID + keypair appear
2. Fill in ownerEmail — click "Register with IDP"
3. Confirm success state + "magic link sent" message
4. Check server console for the magic link URL

- [ ] **Step 4: Commit**

```bash
git add src/app/init/ src/components/init-form.tsx
git commit -m "feat: add init page with client-side Ed25519 keygen and registration form"
```

---

## Task 11: Passport Card Page (/passport/[id])

**Files:**
- Create: `src/app/passport/[id]/page.tsx`

- [ ] **Step 1: Create passport detail page**

Create `src/app/passport/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const passport = await prisma.passport.findUnique({ where: { id } })

  if (!passport) notFound()

  const tags = passport.tags as Record<string, string> | null

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Passport</h1>
        <Link href="/"><Button variant="outline" size="sm">← Registry</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="font-mono text-base">{passport.id}</span>
            <StatusBadge status={passport.status as 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {passport.name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
              <p className="mt-1">{passport.name}</p>
            </div>
          )}
          {passport.description && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
              <p className="mt-1 text-sm">{passport.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Key</p>
            <details className="mt-1">
              <summary className="text-sm cursor-pointer font-mono text-muted-foreground">
                {passport.publicKey.slice(0, 20)}…{' '}
                <span className="text-xs underline">show full</span>
              </summary>
              <p className="font-mono text-xs break-all mt-2 bg-muted p-2 rounded select-all">
                {passport.publicKey}
              </p>
            </details>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Owner</p>
            <p className="mt-1 text-sm">
              {passport.ownerEmail ? maskEmail(passport.ownerEmail) : '—'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="mt-1 text-sm">{new Date(passport.createdAt).toLocaleString()}</p>
            </div>
            {passport.claimedAt && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Claimed</p>
                <p className="mt-1 text-sm">{new Date(passport.claimedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
          {tags && Object.keys(tags).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Tags</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(tags).map(([k, v]) => (
                  <span key={k} className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Test in browser**

Navigate to http://localhost:3000/passport/agnt_aabbccdd11223344. Expected: passport card with all fields.

Navigate to http://localhost:3000/passport/agnt_doesnotexist. Expected: Next.js 404 page.

- [ ] **Step 3: Commit**

```bash
git add "src/app/passport/[id]/"
git commit -m "feat: add passport detail page"
```

---

## Task 12: Claim Page (/claim)

**Files:**
- Create: `src/components/claim-button.tsx`
- Create: `src/app/claim/page.tsx`

- [ ] **Step 1: Create ClaimButton client component**

Create `src/components/claim-button.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ClaimButton({ token, passportId }: { token: string; passportId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/passport/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Claim failed')
        return
      }
      router.push(`/passport/${passportId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClaim} disabled={loading}>
        {loading ? 'Confirming...' : 'Confirm Ownership'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create claim landing page**

Create `src/app/claim/page.tsx`:
```tsx
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/crypto'
import { ClaimButton } from '@/components/claim-button'
import { StatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <Card className="max-w-md">
        <CardHeader><CardTitle>Invalid Link</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No token provided. Check the link in your email.</p>
        </CardContent>
      </Card>
    )
  }

  const tokenHash = hashToken(token)
  const claimToken = await prisma.claimToken.findUnique({
    where: { token: tokenHash },
    include: { passport: true },
  })

  if (!claimToken) {
    return (
      <Card className="max-w-md">
        <CardHeader><CardTitle>Invalid Token</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This link is invalid or does not exist.</p>
        </CardContent>
      </Card>
    )
  }

  if (claimToken.usedAt) {
    return (
      <Card className="max-w-md">
        <CardHeader><CardTitle>Already Claimed</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">This passport has already been claimed.</p>
        </CardContent>
      </Card>
    )
  }

  if (claimToken.expiresAt < new Date()) {
    return (
      <Card className="max-w-md">
        <CardHeader><CardTitle>Link Expired</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This link expired after 24 hours. Register the agent again to receive a new link.
          </p>
        </CardContent>
      </Card>
    )
  }

  const passport = claimToken.passport

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Claim Agent Passport</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <span className="font-mono">{passport.id}</span>
            <StatusBadge status={passport.status as 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {passport.name && (
            <p><span className="text-muted-foreground text-sm">Name: </span>{passport.name}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Confirm that you are the owner of this agent. This action cannot be undone.
          </p>
          <ClaimButton token={token} passportId={passport.id} />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: End-to-end test**

1. `npm run dev`
2. Go to http://localhost:3000/init
3. Click "Init Agent" — note generated ID
4. Fill in ownerEmail and name — click "Register with IDP"
5. Copy magic link URL from server console
6. Open magic link in browser — confirm claim page shows correct agent
7. Click "Confirm Ownership" — confirm redirect to `/passport/[id]` with "Claimed" badge
8. Go to http://localhost:3000 — confirm agent shows "Claimed" in registry
9. Open the magic link again — confirm "Already Claimed" message

- [ ] **Step 4: Commit**

```bash
git add src/app/claim/ src/components/claim-button.tsx
git commit -m "feat: add claim landing page and confirm ownership flow"
```

---

## Final Verification

```bash
npm test
```

Expected: 8 tests pass (`crypto.test.ts` 5, `mask.test.ts` 3)

```bash
npm run dev
```

Full happy path:
1. http://localhost:3000 → empty registry with "+ Init New Agent" button
2. http://localhost:3000/init → init agent, fill form, register → success + console link
3. Magic link → claim page → confirm ownership → passport shows CLAIMED badge
4. http://localhost:3000 → agent in registry with CLAIMED status
