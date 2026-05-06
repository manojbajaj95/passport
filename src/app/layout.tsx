import type { Metadata } from 'next'
import Link from 'next/link'
import { Fingerprint, KeyRound } from 'lucide-react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Passport',
  description: 'Cryptographic identity for AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[oklch(0.982_0.011_83.7/0.88)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-md bg-zinc-950 text-white shadow-sm">
                <Fingerprint className="size-4" aria-hidden />
              </span>
              <span>Agent Passport</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/registry" className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/70 hover:text-zinc-950 sm:inline-flex">
                Registry
              </Link>
              <Link href="/claim" className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-white/70 hover:text-zinc-950 sm:inline-flex">
                Claim
              </Link>
              <Link href="/init" className="inline-flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800">
                <KeyRound className="size-3.5" aria-hidden />
                New Agent
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
