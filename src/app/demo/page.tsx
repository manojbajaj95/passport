import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DemoFlow } from '@/components/demo-flow'

export default function DemoPage() {
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
          
          <div className="relative z-10">
            <p className="text-label-uppercase tracking-[1.5px] text-m-blue-light mb-4">LIVE DEMO</p>
            <h1 className="text-display-lg font-bmw-display uppercase text-foreground leading-[1.05]">
              AGENT IDENTITY <br />IN ACTION.
            </h1>
            <p className="mt-6 text-body-md text-body font-light max-w-xl">
              This demo runs entirely in your browser. Your private key is generated locally and never
              sent to the server — only a signature over a challenge nonce is transmitted.
            </p>
          </div>
        </section>
        
        <div className="max-w-4xl">
          <DemoFlow />
        </div>
      </div>
    </div>
  )
}
