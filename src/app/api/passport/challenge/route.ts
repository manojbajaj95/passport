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
