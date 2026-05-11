import type { Metadata } from 'next'
import Link from 'next/link'
import { Fingerprint, KeyRound, ChevronRight } from 'lucide-react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Passport',
  description: 'Cryptographic identity for AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <nav className="sticky top-0 z-20 bg-background border-b border-border h-16 flex items-center justify-center">
          <div className="w-full max-w-[1440px] px-6 lg:px-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 font-bmw-display font-bold uppercase tracking-tight text-foreground text-xl">
              <span className="flex items-center justify-center bg-foreground text-background p-1.5 border border-transparent">
                <Fingerprint className="size-5" aria-hidden />
              </span>
              <span>AGENT PASSPORT</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/registry" className="hidden text-[14px] font-bmw-display font-bold tracking-[1.5px] uppercase text-foreground transition-colors sm:inline-flex">
                Registry
              </Link>
              <Link href="/claim" className="hidden text-[14px] font-bmw-display font-bold tracking-[1.5px] uppercase text-foreground transition-colors sm:inline-flex">
                Claim
              </Link>
              <Link href="/get-started" className="inline-flex items-center justify-center h-12 px-8 text-[14px] font-bmw-display font-bold tracking-[1.5px] uppercase text-on-dark bg-background border border-border hover:bg-surface-elevated transition-colors rounded-none">
                <KeyRound className="size-4 mr-2" aria-hidden />
                GET STARTED
              </Link>
            </div>
          </div>
        </nav>
        <main className="w-full flex flex-col">{children}</main>
      </body>
    </html>
  )
}
