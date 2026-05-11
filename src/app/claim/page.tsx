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
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-label-uppercase text-body hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="size-4" aria-hidden />
          BACK TO HOME
        </Link>
        
        <section className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="relative overflow-hidden p-8 sm:p-12 border border-hairline bg-surface-card flex flex-col justify-between h-full">
            {/* M stripe border at the top of the card */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-m-blue-light via-m-blue-dark to-m-red" />

            <div className="relative z-10 mb-12">
              <p className="text-label-uppercase tracking-[1.5px] text-m-blue-light mb-4">OWNERSHIP VERIFICATION</p>
              <h1 className="text-display-lg font-bmw-display uppercase text-foreground leading-[1.05]">
                CLAIM AN AGENT <br />PASSPORT.
              </h1>
              <p className="mt-6 text-body-md text-body font-light max-w-xl">
                Paste the claim token or open the magic link from your email. The passport changes from pending to claimed instantly.
              </p>
            </div>
            
            <div className="relative z-10 mt-auto grid gap-4 sm:grid-cols-2">
              <div className="border border-hairline bg-background p-6 transition-colors hover:border-hairline-strong">
                <MailCheck className="size-6 text-m-blue-dark mb-4" aria-hidden />
                <p className="text-title-sm text-foreground uppercase">TOKEN PROVES INBOX ACCESS</p>
              </div>
              <div className="border border-hairline bg-background p-6 transition-colors hover:border-hairline-strong">
                <BadgeCheck className="size-6 text-success mb-4" aria-hidden />
                <p className="text-title-sm text-foreground uppercase">REGISTRY STATUS UPDATES LIVE</p>
              </div>
            </div>
          </div>
          
          <ClaimForm initialToken={token ?? ''} />
        </section>
      </div>
    </div>
  )
}
