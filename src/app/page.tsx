import Link from 'next/link'
import { BadgeCheck, CircleCheck, Clock3, Fingerprint, KeyRound, MailCheck, Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PassportOrbit } from '@/components/passport-orbit'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const passports = await prisma.passport.findMany({
    orderBy: { createdAt: 'desc' },
    select: { status: true },
  })

  const claimed = passports.filter((passport) => passport.status === 'CLAIMED').length
  const unclaimed = passports.filter((passport) => passport.status === 'UNCLAIMED').length
  return (
    <div>
      <section className="relative -mx-4 -mt-8 min-h-[calc(100vh-65px)] overflow-hidden border-b border-zinc-200/80 px-4 py-10 sm:py-14">
        <PassportOrbit className="left-auto right-0 top-8 h-[420px] w-full opacity-90 sm:h-[560px] lg:w-[58%]" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/75 px-3 py-1 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-teal-500" />
              Live agent identity registry
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
              Give every agent a passport people can trust.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Issue a cryptographic identity, send an ownership claim, and show the verified status in a browser-ready registry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/init">
                <Button size="lg" className="h-11 px-4 text-base">
                  <Plus className="size-4" aria-hidden />
                  Start Demo
                </Button>
              </Link>
              <Link href="/claim">
                <Button size="lg" variant="outline" className="h-11 bg-white/75 px-4 text-base backdrop-blur">
                  Claim Token
                </Button>
              </Link>
              <Link href="/registry">
                <Button size="lg" variant="outline" className="h-11 bg-white/75 px-4 text-base backdrop-blur">
                  View Registry
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="demo-panel p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="size-4 text-teal-700" aria-hidden />
                  Init
                </div>
                <p className="mt-2 text-sm font-medium">Generate local keys</p>
              </div>
              <div className="demo-panel p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MailCheck className="size-4 text-amber-700" aria-hidden />
                  Claim
                </div>
                <p className="mt-2 text-sm font-medium">Verify ownership</p>
              </div>
              <div className="demo-panel p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="size-4 text-zinc-700" aria-hidden />
                  Present
                </div>
                <p className="mt-2 text-sm font-medium">Show trusted status</p>
              </div>
            </div>
          </div>
          <div className="demo-panel-strong relative min-h-[360px] overflow-hidden p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-amber-300 to-zinc-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Registry Snapshot</p>
                <p className="mt-1 text-3xl font-semibold">{passports.length} passports</p>
              </div>
              <Fingerprint className="size-8 text-teal-300" aria-hidden />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-white/10 bg-white/8 p-4">
                <CircleCheck className="size-5 text-teal-300" aria-hidden />
                <div className="mt-5 text-4xl font-semibold">{claimed}</div>
                <div className="mt-1 text-sm text-zinc-400">Claimed</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/8 p-4">
                <Clock3 className="size-5 text-amber-300" aria-hidden />
                <div className="mt-5 text-4xl font-semibold">{unclaimed}</div>
                <div className="mt-1 text-sm text-zinc-400">Pending</div>
              </div>
            </div>
            <div className="mt-8 rounded-md border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-xs uppercase text-zinc-500">Demo protocol</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-teal-300" /> Browser generates private key</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-amber-300" /> API stores public passport</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-zinc-200" /> Owner claims by magic link</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
