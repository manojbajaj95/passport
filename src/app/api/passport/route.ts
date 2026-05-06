import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import type { PassportSummary } from '@/types/passport'

export async function GET() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true, ownerEmail: true },
  })

  const result: PassportSummary[] = passports.map((p: {
    id: string
    name: string | null
    status: string
    createdAt: Date
    ownerEmail: string | null
  }) => ({
    id: p.id,
    name: p.name,
    status: p.status as PassportSummary['status'],
    createdAt: p.createdAt.toISOString(),
    ownerEmail: p.ownerEmail ? maskEmail(p.ownerEmail) : null,
  }))

  return NextResponse.json(result)
}
