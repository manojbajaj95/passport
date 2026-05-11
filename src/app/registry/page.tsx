import Link from 'next/link'
import { ArrowLeft, ArrowRight, Fingerprint, Plus, ShieldAlert } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { maskEmail } from '@/lib/mask'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { did: true, handle: true, name: true, status: true, createdAt: true, ownerEmail: true, description: true },
  })

  const revoked = passports.filter((passport) => passport.status === 'REVOKED').length

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-label-uppercase text-body hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="size-4" aria-hidden />
          BACK TO HOME
        </Link>

        <section className="relative overflow-hidden p-8 sm:p-12 border border-hairline bg-surface-card mb-12">
          {/* M stripe border at the top of the card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-m-blue-light via-m-blue-dark to-m-red" />
          
          <div className="flex flex-wrap items-end justify-between gap-5 relative z-10">
            <div>
              <p className="text-label-uppercase tracking-[1.5px] text-m-blue-light mb-4">REGISTRY</p>
              <h1 className="text-display-lg font-bmw-display uppercase text-foreground leading-[1.05]">
                ISSUED AGENT<br />PASSPORTS.
              </h1>
              <p className="mt-6 text-body-md text-body font-light max-w-xl">
                A presentation-friendly view of every agent identity currently registered in this environment.
              </p>
            </div>
            <Link href="/get-started">
              <Button>
                <Plus className="size-4 mr-2" aria-hidden />
                CONNECT AGENT
              </Button>
            </Link>
          </div>
        </section>

        {passports.length === 0 ? (
          <div className="border border-hairline bg-surface-card px-6 py-24 text-center flex flex-col items-center">
            <Fingerprint className="size-16 text-m-blue-light opacity-50 mb-6" aria-hidden />
            <h2 className="text-display-sm text-foreground uppercase mb-4">NO PASSPORTS REGISTERED</h2>
            <p className="max-w-md text-body-md text-body font-light mb-8">
              Start by connecting an agent. The private key stays in the environment, and the public record appears here.
            </p>
            <Link href="/get-started">
              <Button>
                <Plus className="size-4 mr-2" aria-hidden />
                CONNECT AGENT
              </Button>
            </Link>
          </div>
        ) : (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
              <p className="text-label-uppercase text-body tracking-[1.5px]">
                {passports.length} PASSPORT{passports.length === 1 ? '' : 'S'} REGISTERED
              </p>
              {revoked > 0 && (
                <div className="flex items-center gap-2 text-label-uppercase text-m-red tracking-[1.5px]">
                  <ShieldAlert className="size-4" aria-hidden />
                  {revoked} REVOKED
                </div>
              )}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {passports.map((p) => (
                <Link key={p.did} href={`/passport/${p.handle}`} className="border border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong transition-all p-8 flex flex-col group">
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <div className="text-label-uppercase text-body tracking-[1.5px] mb-3">AGENT PASSPORT</div>
                      <h2 className="text-title-lg text-foreground uppercase">{p.name ?? p.handle}</h2>
                      <p className="mt-3 line-clamp-2 text-body-sm text-body font-light">
                        {p.description ?? 'No description registered.'}
                      </p>
                    </div>
                    <ArrowRight className="size-6 text-body group-hover:text-foreground transition-colors mt-1" aria-hidden />
                  </div>
                  
                  <div className="font-mono text-sm bg-background border border-hairline px-4 py-3 text-body mb-6 w-full overflow-hidden text-ellipsis">
                    {p.handle}
                  </div>
                  
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-6 border-t border-hairline">
                    <StatusBadge status={p.status} />
                    <span className="text-label-uppercase text-body tracking-[1.5px]">{p.ownerEmail ? maskEmail(p.ownerEmail) : 'NO OWNER'}</span>
                    <span className="text-label-uppercase text-body tracking-[1.5px] ml-auto">{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(p.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
