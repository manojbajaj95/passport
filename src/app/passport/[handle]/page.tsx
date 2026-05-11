import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Mail, Key } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { PassportBook } from '@/components/passport-book'

export const dynamic = 'force-dynamic'

function formatDate(value: Date | null) {
  if (!value) return 'Not claimed'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const passport = await prisma.passport.findUnique({ where: { handle } })

  if (!passport) notFound()

  const issued = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(passport.createdAt)
  const expires = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(passport.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000)
  )
  const displayName = passport.name ?? 'Unnamed Agent'
  const ownerEmail = passport.ownerEmail ? maskEmail(passport.ownerEmail) : 'No owner'
  const description = passport.description ?? 'No description registered.'
  const machineLine = `${passport.handle.replace(/-/g, '<').toUpperCase()}<<${displayName.replace(/[^a-zA-Z0-9]/g, '<').toUpperCase()}`

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-label-uppercase text-body hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="size-4" aria-hidden />
          REGISTRY
        </Link>

        <div className="flex flex-col gap-12">
          {/* Full Width Passport Section */}
          <section className="w-full">
            <PassportBook
              id={passport.handle}
              name={displayName}
              description={description}
              publicKey={passport.publicKey}
              ownerEmail={ownerEmail}
              status={passport.status}
              issued={issued}
              expires={expires}
              machineLine={machineLine}
            />
          </section>

          {/* Metadata Section Below */}
          <section className="grid gap-8 md:grid-cols-2">
            <div className="border border-hairline bg-surface-card p-8">
              <h2 className="text-title-lg text-foreground uppercase mb-8">OWNERSHIP DETAILS</h2>
              <div className="grid sm:grid-cols-3 gap-8">
                <div className="flex flex-col gap-2">
                  <div className="text-label-uppercase text-body flex items-center gap-2">
                    <Mail className="size-4" aria-hidden /> OWNER
                  </div>
                  <div className="text-body-md text-foreground">{ownerEmail}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-label-uppercase text-body flex items-center gap-2">
                    <CalendarClock className="size-4" aria-hidden /> REGISTERED
                  </div>
                  <div className="text-body-md text-foreground">{formatDate(passport.createdAt)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-label-uppercase text-body flex items-center gap-2">
                    <CalendarClock className="size-4" aria-hidden /> CLAIMED
                  </div>
                  <div className="text-body-md text-foreground">{formatDate(passport.claimedAt)}</div>
                </div>
              </div>
            </div>

            <div className="border border-hairline bg-surface-card p-8">
              <h2 className="text-title-lg text-foreground uppercase mb-8">CRYPTOGRAPHIC IDENTITY</h2>
              <div className="flex flex-col gap-2">
                <div className="text-label-uppercase text-body flex items-center gap-2">
                  <Key className="size-4" aria-hidden /> DECENTRALIZED IDENTIFIER (DID)
                </div>
                <div className="font-mono text-sm break-all text-body bg-background border border-hairline p-4 select-all">
                  {passport.did}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
