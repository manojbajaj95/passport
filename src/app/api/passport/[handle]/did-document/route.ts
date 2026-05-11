import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildDidDocument } from '@/lib/did'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  const passport = await prisma.passport.findUnique({ where: { handle } })

  if (!passport) {
    return NextResponse.json({ error: 'passport_not_found' }, { status: 404 })
  }

  return NextResponse.json(buildDidDocument(passport.did))
}
