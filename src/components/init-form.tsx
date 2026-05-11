'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Copy, KeyRound, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { AgentPromptDialog } from '@/components/agent-prompt-dialog'
import * as ed from '@noble/ed25519'
import { base58 } from '@scure/base'

function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array([0xed, 0x01, ...publicKey])
  return `did:key:z${base58.encode(prefixed)}`
}

type Step = 'idle' | 'initialized' | 'success'

interface AgentKeys {
  did: string
  privateKeyHex: string
}

async function initAgent(): Promise<AgentKeys> {
  const privateKey = ed.utils.randomSecretKey()
  const publicKey = await ed.getPublicKeyAsync(privateKey)
  const did = didFromPublicKey(publicKey)
  const privateKeyHex = Buffer.from(privateKey).toString('hex')
  return { did, privateKeyHex }
}

export function InitForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [keys, setKeys] = useState<AgentKeys | null>(null)
  const [handle, setHandle] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleInit() {
    setLoading(true)
    try {
      const agentKeys = await initAgent()
      setKeys(agentKeys)
      setStep('initialized')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!keys) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/passport/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: keys.did,
          ownerEmail: ownerEmail || undefined,
          name: name || undefined,
          description: description || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed')
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('passport_private_key', keys.privateKeyHex)
        localStorage.setItem('passport_did', keys.did)
        localStorage.setItem('passport_handle', data.handle)
      }

      setHandle(data.handle)
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'idle') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden />
              Generate in browser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generates an Ed25519 keypair locally and derives a DID from the public key.
              The private key never leaves this page.
            </p>
            <Button onClick={handleInit} disabled={loading}>
              <KeyRound className="size-4" aria-hidden />
              {loading ? 'Generating...' : 'Init Agent'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-600">
              <span className="text-base">🤖</span>
              Let your agent register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Copy a ready-made prompt and paste it into your agent. It will read <code className="font-mono text-xs bg-muted px-1 rounded">SKILLS.md</code>, generate its own keypair, and register itself.
            </p>
            <AgentPromptDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'initialized' && keys) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4" aria-hidden />
              Keys generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">DID</Label>
              <div className="font-mono text-xs bg-muted px-3 py-2 rounded mt-1 break-all select-all">
                {keys.did}
              </div>
            </div>
            <div className="border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded p-3">
              <Label className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                <Copy className="size-3.5" aria-hidden />
                Private Key (hex) — Save this now
              </Label>
              <div className="font-mono text-xs bg-white dark:bg-black px-3 py-2 rounded mt-2 break-all select-all">
                {keys.privateKeyHex}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                This key never leaves your browser. Copy it before registering.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader><CardTitle>Register passport</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerEmail">Owner Email <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name">Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Agent" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" className="mt-1" rows={2} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleRegister} disabled={loading}>
              <ArrowRight className="size-4" aria-hidden />
              {loading ? 'Registering...' : 'Register Agent'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success' && handle) {
    return (
      <Card className="max-w-xl rounded-lg">
        <CardHeader><CardTitle>Registration complete</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <StatusBadge status="UNCLAIMED" />
          </div>
          <p className="text-sm text-muted-foreground">
            {ownerEmail
              ? 'A claim link has been sent to your email. Click it to confirm ownership.'
              : 'Passport registered without an owner. Use the demo to authenticate.'}
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">Handle</Label>
            <div className="font-mono text-sm bg-muted px-3 py-2 rounded mt-1 select-all">
              {handle}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push(`/passport/${handle}`)}>
            <ArrowRight className="size-4" aria-hidden />
            View Passport
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
