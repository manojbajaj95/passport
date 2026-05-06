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

type Step = 'idle' | 'initialized' | 'success'

interface AgentKeys {
  agentId: string
  publicKey: string
  privateKeyB64: string
}

const adverbs = [
  'boldly', 'brightly', 'calmly', 'clearly', 'deftly', 'eagerly', 'gently', 'keenly',
  'lightly', 'nimbly', 'quickly', 'quietly', 'readily', 'steadily', 'swiftly', 'warmly',
]

const adjectives = [
  'amber', 'bright', 'copper', 'crimson', 'frost', 'golden', 'green', 'ivory',
  'jade', 'lucid', 'polar', 'silver', 'solar', 'true', 'urban', 'violet',
]

const nouns = [
  'anchor', 'atlas', 'beacon', 'bridge', 'cipher', 'comet', 'forge', 'harbor',
  'ledger', 'matrix', 'signal', 'summit', 'vector', 'vault', 'voyage', 'witness',
]

function randomWord(words: string[], bytes: Uint8Array, index: number) {
  return words[bytes[index] % words.length]
}

async function initAgent(): Promise<AgentKeys> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(3))
  const agentId = `agnt_${randomWord(adverbs, randomBytes, 0)}-${randomWord(adjectives, randomBytes, 1)}-${randomWord(nouns, randomBytes, 2)}`

  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  )

  const pubBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(pubBuffer)))

  const privBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const privateKeyB64 = btoa(String.fromCharCode(...new Uint8Array(privBuffer)))

  return { agentId, publicKey, privateKeyB64 }
}

export function InitForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [keys, setKeys] = useState<AgentKeys | null>(null)
  const [passportId, setPassportId] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
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
      let parsedTags: Record<string, string> | undefined
      if (tags.trim()) {
        try {
          parsedTags = JSON.parse(tags)
        } catch {
          setError('Tags must be valid JSON, e.g. {"env":"prod"}')
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/passport/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: keys.agentId,
          publicKey: keys.publicKey,
          ownerEmail,
          name: name || undefined,
          description: description || undefined,
          tags: parsedTags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Registration failed')
        return
      }

      const data = await res.json()
      setPassportId(data.passportId)
      setStep('success')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'idle') {
    return (
      <Card className="max-w-xl rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden />
            Generate local identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generates a unique Agent ID and Ed25519 keypair locally in your browser.
            The private key never leaves this page.
          </p>
          <Button onClick={handleInit} disabled={loading}>
            <KeyRound className="size-4" aria-hidden />
            {loading ? 'Generating...' : 'Init Agent'}
          </Button>
        </CardContent>
      </Card>
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
              <Label className="text-xs text-muted-foreground">Agent ID</Label>
              <div className="font-mono text-sm bg-muted px-3 py-2 rounded mt-1 break-all select-all">
                {keys.agentId}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Public Key (Base64)</Label>
              <div className="font-mono text-xs bg-muted px-3 py-2 rounded mt-1 break-all select-all">
                {keys.publicKey}
              </div>
            </div>
            <div className="border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded p-3">
              <Label className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                <Copy className="size-3.5" aria-hidden />
                Private Key — Save this now
              </Label>
              <div className="font-mono text-xs bg-white dark:bg-black px-3 py-2 rounded mt-2 break-all select-all">
                {keys.privateKeyB64}
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
              <Label htmlFor="ownerEmail">Owner Email *</Label>
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
            <div>
              <Label htmlFor="tags">Tags <span className="text-muted-foreground">(optional, JSON)</span></Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder='{"env":"prod"}' className="mt-1" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleRegister} disabled={loading || !ownerEmail}>
              <ArrowRight className="size-4" aria-hidden />
              {loading ? 'Registering...' : 'Register Agent'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'success' && passportId) {
    return (
      <Card className="max-w-xl rounded-lg">
        <CardHeader><CardTitle>Registration complete</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <StatusBadge status="UNCLAIMED" />
          </div>
          <p className="text-sm text-muted-foreground">
            A magic link has been sent to your email. Click it to claim ownership of this passport.
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">Passport ID</Label>
            <div className="font-mono text-sm bg-muted px-3 py-2 rounded mt-1 break-all select-all">
              {passportId}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push(`/passport/${passportId}`)}>
            <ArrowRight className="size-4" aria-hidden />
            View Passport
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
