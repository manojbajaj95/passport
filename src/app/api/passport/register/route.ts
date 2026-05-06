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

  const readableAgentId = /^agnt_[a-z]+-[a-z]+-[a-z]+$/
  const legacyAgentId = /^agnt_[0-9a-f]{16}$/
  if (!readableAgentId.test(agentId) && !legacyAgentId.test(agentId)) {
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
