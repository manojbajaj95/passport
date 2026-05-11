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
      <section className="relative -mx-4 -mt-8 min-h-[calc(100vh-65px)] overflow-hidden border-b border-zinc-200/80 px-4 py-10 sm:py-14 bg-[#f8fafc]">
        {/* Decorative passport background texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-multiply">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bg-pattern" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                <path d="M0 50 Q 25 0 50 50 T 100 50 M0 50 Q 25 100 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern)"/>
          </svg>
        </div>

        <PassportOrbit className="left-auto right-0 top-8 h-[420px] w-full opacity-90 sm:h-[560px] lg:w-[58%]" />
        
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/50 bg-white/75 px-3 py-1 text-sm font-medium text-teal-800 shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              Live agent identity registry
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl drop-shadow-sm">
              Give every agent a <span className="text-teal-700">passport</span> people can trust.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Issue a cryptographic identity, send an ownership claim, and show the verified status in a browser-ready registry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/init">
                <Button size="lg" className="h-11 px-4 text-base bg-teal-700 hover:bg-teal-800 text-white shadow-md">
                  <Plus className="size-4" aria-hidden />
                  Start Demo
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="h-11 bg-white/75 px-4 text-base backdrop-blur border-teal-200/50 text-teal-900 hover:bg-teal-50">
                  Live Demo
                </Button>
              </Link>
              <Link href="/registry">
                <Button size="lg" variant="outline" className="h-11 bg-white/75 px-4 text-base backdrop-blur border-teal-200/50 text-teal-900 hover:bg-teal-50">
                  View Registry
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-sm text-teal-700">
                  <KeyRound className="size-4" aria-hidden />
                  Init
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-900">Generate local keys</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <MailCheck className="size-4" aria-hidden />
                  Claim
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-900">Verify ownership</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-white/60 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <BadgeCheck className="size-4" aria-hidden />
                  Present
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-900">Show trusted status</p>
              </div>
            </div>
          </div>
          <div className="demo-panel-strong relative min-h-[360px] overflow-hidden p-6 border border-zinc-200/50 shadow-xl bg-[linear-gradient(145deg,#ffffff,#f1f5f9)] rounded-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-amber-300 to-zinc-200" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
              <Fingerprint className="size-full scale-[1.5] translate-x-1/4 translate-y-1/4" aria-hidden />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider font-mono">Registry Snapshot</p>
                <p className="mt-1 text-3xl font-semibold text-zinc-900">{passports.length} passports</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
                <Fingerprint className="size-6 text-teal-600" aria-hidden />
              </div>
            </div>
            <div className="relative mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <CircleCheck className="size-5 text-teal-600" aria-hidden />
                <div className="mt-5 text-4xl font-semibold text-zinc-900">{claimed}</div>
                <div className="mt-1 text-sm font-medium text-zinc-500 uppercase font-mono tracking-wider">Claimed</div>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                <Clock3 className="size-5 text-amber-500" aria-hidden />
                <div className="mt-5 text-4xl font-semibold text-zinc-900">{unclaimed}</div>
                <div className="mt-1 text-sm font-medium text-zinc-500 uppercase font-mono tracking-wider">Pending</div>
              </div>
            </div>
            <div className="relative mt-8 rounded-lg border border-teal-100 bg-teal-50/50 p-4 backdrop-blur">
              <p className="font-mono text-xs font-semibold tracking-widest uppercase text-teal-800">Demo protocol</p>
              <div className="mt-3 space-y-3 text-sm font-medium text-zinc-700">
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" /> Browser generates private key</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> API stores public passport</div>
                <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]" /> Owner claims by magic link</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
