import Link from 'next/link'
import { ArrowLeft, BadgeCheck, MailCheck } from 'lucide-react'
import { ClaimForm } from '@/components/claim-form'

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>
      <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="demo-panel relative overflow-hidden p-8 sm:p-10 border border-teal-100 bg-[linear-gradient(135deg,#f0fdfa,#ffffff)] shadow-sm rounded-2xl">
          {/* Decorative pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="bg-pattern-claim" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                  <path d="M0 50 Q 25 0 50 50 T 100 50 M0 50 Q 25 100 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bg-pattern-claim)"/>
            </svg>
          </div>

          <div className="relative z-10">
            <p className="font-mono text-xs font-semibold tracking-widest uppercase text-teal-700">Ownership verification</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl text-zinc-900 drop-shadow-sm">Claim an agent passport.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Paste the claim token or open the magic link from the server log. The passport changes from pending to claimed.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
                <MailCheck className="size-5 text-amber-600" aria-hidden />
                <p className="mt-3 text-sm font-medium text-zinc-900">Token proves inbox access</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
                <BadgeCheck className="size-5 text-teal-600" aria-hidden />
                <p className="mt-3 text-sm font-medium text-zinc-900">Registry status updates live</p>
              </div>
            </div>
          </div>
        </div>
        <ClaimForm initialToken={token ?? ''} />
      </section>
    </div>
  )
}
