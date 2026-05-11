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
    data: { did, handle, publicKey, ownerEmail: ownerEmail ?? null, name: name ?? null, description: description ?? null },
  })

  const responseBody: Record<string, unknown> = {
    did: passport.did,
    handle: passport.handle,
    name: passport.name,
    description: passport.description,
    ownerEmail: passport.ownerEmail,
    status: passport.status,
    createdAt: passport.createdAt,
  }

  if (ownerEmail) {
    const rawToken = generateClaimToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.claimToken.create({
      data: { token: tokenHash, did, email: ownerEmail, expiresAt },
    })

    const baseUrl = request.headers.get('origin') ?? 'http://localhost:3000'
    await sendClaimEmail(ownerEmail, handle, rawToken, baseUrl)

    if (process.env.NODE_ENV === 'development') {
      responseBody._devClaimToken = rawToken
    }
  }

  return NextResponse.json(responseBody, { status: 201 })
}
