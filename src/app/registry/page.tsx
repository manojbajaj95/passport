import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Fingerprint, Plus, ShieldAlert } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true, createdAt: true, ownerEmail: true, description: true },
  })

  const revoked = passports.filter((passport) => passport.status === 'REVOKED').length

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Home
      </Link>

      <section className="demo-panel overflow-hidden p-8 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Registry</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Issued agent passports</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              A presentation-friendly view of every agent identity currently registered in this environment.
            </p>
          </div>
          <Link href="/init">
            <Button className="h-10">
              <Plus className="size-4" aria-hidden />
              New Agent
            </Button>
          </Link>
        </div>
      </section>

      {passports.length === 0 ? (
        <div className="demo-panel px-6 py-16 text-center">
          <Fingerprint className="mx-auto size-10 text-teal-700" aria-hidden />
          <h2 className="mt-5 text-2xl font-semibold">No passports registered yet</h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
            Start the demo by issuing a passport. The private key stays in the browser, and the public record appears here.
          </p>
          <Link href="/init" className="mt-5 inline-flex">
            <Button>
              <Plus className="size-4" aria-hidden />
              Start Demo
            </Button>
          </Link>
        </div>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {passports.length} passport{passports.length === 1 ? '' : 's'} registered
            </p>
            {revoked > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <ShieldAlert className="size-4" aria-hidden />
                {revoked} revoked
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {passports.map((p) => (
              <Link key={p.id} href={`/passport/${p.id}`} className="demo-panel group block p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-xs uppercase text-muted-foreground">Agent passport</div>
                    <h2 className="mt-2 text-2xl font-semibold">{p.name ?? 'Unnamed agent'}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {p.description ?? 'No description registered.'}
                    </p>
                  </div>
                  <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-zinc-950" aria-hidden />
                </div>
                <div className="mt-5 code-tile text-xs">{p.id}</div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <StatusBadge status={p.status} />
                  <span className="text-sm text-muted-foreground">{p.ownerEmail ? maskEmail(p.ownerEmail) : 'No owner'}</span>
                  <span className="text-sm text-muted-foreground">{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(p.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
