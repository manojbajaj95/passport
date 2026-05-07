import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Mail } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { PassportBook } from '@/components/passport-book'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
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

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="demo-panel">
            <CardHeader><CardTitle>Ownership</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <div>
                  <div className="text-muted-foreground">Owner</div>
                  <div className="font-medium">{ownerEmail}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <div>
                  <div className="text-muted-foreground">Registered</div>
                  <div className="font-medium">{formatDate(passport.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <div>
                  <div className="text-muted-foreground">Claimed</div>
                  <div className="font-medium">{formatDate(passport.claimedAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="demo-panel">
            <CardHeader><CardTitle>DID</CardTitle></CardHeader>
            <CardContent>
              <p className="font-mono text-xs break-all text-muted-foreground">{passport.did}</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
