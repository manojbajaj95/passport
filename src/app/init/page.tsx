import Link from 'next/link'
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react'
import { InitForm } from '@/components/init-form'
import { PassportOrbit } from '@/components/passport-orbit'

export default function InitPage() {
  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-teal-700 transition-colors">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>
      <section className="demo-panel relative overflow-hidden p-8 sm:p-10 border border-teal-100 bg-[linear-gradient(135deg,#f0fdfa,#ffffff)] shadow-sm rounded-2xl">
        {/* Decorative pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bg-pattern-init" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                <path d="M0 50 Q 25 0 50 50 T 100 50 M0 50 Q 25 100 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern-init)"/>
          </svg>
        </div>

        <PassportOrbit className="left-auto right-0 top-0 hidden h-full w-[42%] opacity-50 lg:block" />
        <div className="relative z-10 max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-widest uppercase text-teal-700">Issue passport</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl text-zinc-900 drop-shadow-sm">Initialize an agent identity.</h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            The demo starts in the browser: generate a readable agent ID, create an Ed25519 keypair, and register the public passport.
          </p>
        </div>
        <div className="relative z-10 mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
            <KeyRound className="size-5 text-teal-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-900">Readable agent ID</p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
            <ShieldCheck className="size-5 text-zinc-700" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-900">Private key stays local</p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
            <MailCheck className="size-5 text-amber-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-900">Claim link is issued</p>
          </div>
        </div>
      </section>
      <InitForm />
    </div>
  )
}
