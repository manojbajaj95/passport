'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="demo-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" aria-hidden />
          Claim token
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="token">Token</Label>
          <Input
            id="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste claim token"
            className="mt-2 font-mono"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4" aria-hidden />
              Passport claimed
            </div>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={result.status} />
              <Link href={`/passport/${result.passportId}`} className="font-mono underline underline-offset-4">
                {result.passportId}
              </Link>
            </div>
          </div>
        )}
        <Button className="h-10" onClick={handleClaim} disabled={loading || !token.trim()}>
          {loading ? 'Claiming...' : 'Claim Passport'}
        </Button>
      </CardContent>
    </Card>
  )
}
