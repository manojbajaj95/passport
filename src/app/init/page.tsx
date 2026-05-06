import Link from 'next/link'
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react'
import { InitForm } from '@/components/init-form'
import { PassportOrbit } from '@/components/passport-orbit'

export default function InitPage() {
  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>
      <section className="demo-panel relative overflow-hidden p-8 sm:p-10">
        <PassportOrbit className="left-auto right-0 top-0 hidden h-full w-[42%] opacity-50 lg:block" />
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow">Issue passport</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Initialize an agent identity.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The demo starts in the browser: generate a readable agent ID, create an Ed25519 keypair, and register the public passport.
          </p>
        </div>
        <div className="relative z-10 mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white/70 p-4"><KeyRound className="size-5 text-teal-700" aria-hidden /><p className="mt-3 text-sm font-medium">Readable agent ID</p></div>
          <div className="rounded-md border border-zinc-200 bg-white/70 p-4"><ShieldCheck className="size-5 text-zinc-800" aria-hidden /><p className="mt-3 text-sm font-medium">Private key stays local</p></div>
          <div className="rounded-md border border-zinc-200 bg-white/70 p-4"><MailCheck className="size-5 text-amber-700" aria-hidden /><p className="mt-3 text-sm font-medium">Claim link is issued</p></div>
        </div>
      </section>
      <InitForm />
    </div>
  )
}
