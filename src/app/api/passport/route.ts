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
