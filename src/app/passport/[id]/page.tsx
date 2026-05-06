import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Mail, Tag } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { PassportBook } from '@/components/passport-book'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function formatDate(value: Date | null) {
  if (!value) return 'Not claimed'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function normalizeTags(tags: unknown): Record<string, string> | null {
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) return null
  return Object.fromEntries(
    Object.entries(tags).map(([key, value]) => [key, String(value)])
  )
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const passport = await prisma.passport.findUnique({ where: { id } })

  if (!passport) notFound()

  const tags = normalizeTags(passport.tags)
  const issued = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(passport.createdAt)
  const expires = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
    new Date(passport.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000)
  )
  const displayName = passport.name ?? 'Unnamed Agent'
  const ownerEmail = passport.ownerEmail ? maskEmail(passport.ownerEmail) : 'Pending owner'
  const description = passport.description ?? 'No description has been registered for this agent.'
  const machineLine = `${passport.id.replace(/[^a-zA-Z0-9]/g, '<').toUpperCase()}<<${displayName.replace(/[^a-zA-Z0-9]/g, '<').toUpperCase()}`

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <PassportBook
          id={passport.id}
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
            <CardHeader>
              <CardTitle>Claim</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-4" aria-hidden />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags && Object.keys(tags).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tags).map(([key, value]) => (
                    <span key={key} className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-xs">
                      {key}:{value}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags registered.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
