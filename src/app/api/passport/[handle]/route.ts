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
