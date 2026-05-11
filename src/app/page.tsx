import Link from 'next/link'
import { CircleCheck, Clock3, Fingerprint, Plus, ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
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
    <div className="w-full">
      <section className="relative w-full min-h-[calc(100vh-64px)] flex items-center py-24 bg-background overflow-hidden border-b border-hairline">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-[600px] bg-gradient-to-l from-m-blue-dark/20 to-transparent blur-3xl rounded-full opacity-50 mix-blend-screen" />
          <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-gradient-to-b from-surface-card/50 to-transparent skew-y-12 origin-top-left" />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 grid gap-16 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center text-label-uppercase text-body mb-8">
              <span className="w-8 h-[2px] bg-m-red mr-4" />
              LIVE AGENT IDENTITY REGISTRY
            </div>
            
            <h1 className="text-display-xl text-foreground font-bold tracking-tight uppercase leading-[0.9]">
              THE ULTIMATE<br />
              <span className="text-m-blue-light">AGENT</span> PASSPORT.
            </h1>
            
            <p className="mt-8 max-w-xl text-body-md text-body font-light leading-relaxed">
              Issue a cryptographic identity, send an ownership claim, and show the verified status in a browser-ready registry engineered for precision and trust.
            </p>
            
            <div className="mt-12 flex flex-wrap gap-4">
              <Link href="/get-started">
                <Button>
                  <Plus className="size-4 mr-2" aria-hidden />
                  CONNECT AGENT
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline">
                  LIVE DEMO <ChevronRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative border border-hairline bg-surface-card p-8 min-h-[440px] flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-m-blue-light via-m-blue-dark to-m-red" />
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-label-uppercase text-muted tracking-[1.5px] uppercase">REGISTRY SNAPSHOT</p>
                <p className="text-display-md text-foreground mt-2">{passports.length} AGENTS</p>
              </div>
              <Fingerprint className="size-12 text-m-blue-light opacity-50" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-background border border-hairline p-6 flex flex-col">
                <CircleCheck className="size-6 text-success mb-4" />
                <div className="text-display-sm text-foreground">{claimed}</div>
                <div className="text-caption text-body tracking-[1px] uppercase mt-1">Claimed</div>
              </div>
              <div className="bg-background border border-hairline p-6 flex flex-col">
                <Clock3 className="size-6 text-warning mb-4" />
                <div className="text-display-sm text-foreground">{unclaimed}</div>
                <div className="text-caption text-body tracking-[1px] uppercase mt-1">Pending</div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-hairline">
              <p className="text-label-uppercase text-m-blue-light tracking-[1.5px] mb-4">PROTOCOL HIGHLIGHTS</p>
              <div className="space-y-4 text-body-sm text-body font-light">
                <div className="flex items-center gap-4"><span className="w-1.5 h-1.5 bg-m-blue-light" /> Local key generation via Edge crypto</div>
                <div className="flex items-center gap-4"><span className="w-1.5 h-1.5 bg-m-blue-dark" /> Distributed public registry</div>
                <div className="flex items-center gap-4"><span className="w-1.5 h-1.5 bg-m-red" /> Magic link claim verification</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
