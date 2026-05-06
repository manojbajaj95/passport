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
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Registry
      </Link>
      <section className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="demo-panel p-8 sm:p-10">
          <p className="eyebrow">Ownership verification</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Claim an agent passport.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Paste the claim token or open the magic link from the server log. The passport changes from pending to claimed.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-zinc-200 bg-white/70 p-4">
              <MailCheck className="size-5 text-amber-700" aria-hidden />
              <p className="mt-3 text-sm font-medium">Token proves inbox access</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white/70 p-4">
              <BadgeCheck className="size-5 text-teal-700" aria-hidden />
              <p className="mt-3 text-sm font-medium">Registry status updates live</p>
            </div>
          </div>
        </div>
        <ClaimForm initialToken={token ?? ''} />
      </section>
    </div>
  )
}
