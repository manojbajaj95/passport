'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/status-badge'

interface ClaimResult {
  passportId: string
  status: 'CLAIMED'
}

export function ClaimForm({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken)
  const [result, setResult] = useState<ClaimResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/passport/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Claim failed')
        return
      }

      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-hairline bg-surface-card p-8 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-8">
        <KeyRound className="size-6 text-m-blue-light" aria-hidden />
        <h2 className="text-title-lg text-foreground uppercase">CLAIM TOKEN</h2>
      </div>
      
      <div className="space-y-6 flex-grow">
        <div>
          <Label htmlFor="token" className="text-label-uppercase text-body mb-2 block">TOKEN</Label>
          <Input
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste claim token"
            className="bg-background border-hairline text-foreground h-12 rounded-none font-mono focus-visible:ring-m-blue-light"
          />
        </div>
        
        {error && <p className="text-body-sm text-m-red mt-2">{error}</p>}
        
        {result && (
          <div className="border border-success bg-success/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="size-5 text-success" aria-hidden />
              <div className="text-title-sm text-foreground uppercase">PASSPORT CLAIMED</div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-background border border-hairline px-4 py-2">
                <span className="text-label-uppercase text-body">STATUS:</span>
                <StatusBadge status={result.status} />
              </div>
              <Link href={`/passport/${result.passportId}`} className="flex items-center justify-between font-mono text-sm text-m-blue-light hover:text-m-blue-dark border border-hairline bg-background p-3 transition-colors">
                <span>{result.passportId}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-8 mt-auto border-t border-hairline">
        <Button className="w-full" onClick={handleClaim} disabled={loading || !token.trim()}>
          {loading ? 'CLAIMING...' : 'CLAIM PASSPORT'}
          <ArrowRight className="size-4 ml-2" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
