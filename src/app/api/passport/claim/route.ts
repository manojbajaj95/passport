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
