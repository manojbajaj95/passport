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
