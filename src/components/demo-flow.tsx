'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import * as ed from '@noble/ed25519'
import { base58 } from '@scure/base'

function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array([0xed, 0x01, ...publicKey])
  return `did:key:z${base58.encode(prefixed)}`
}

type Step = 'idle' | 'generated' | 'registered' | 'claimed' | 'challenged' | 'tokenized' | 'verified'

interface DemoState {
  step: Step
  privateKey?: Uint8Array
  did?: string
  handle?: string
  claimToken?: string
  nonce?: string
  token?: string
  tokenPayload?: Record<string, unknown>
  jwksKey?: Record<string, unknown>
  error?: string
  log: string[]
}

const STEP_ORDER: Step[] = ['idle', 'generated', 'registered', 'claimed', 'challenged', 'tokenized', 'verified']

export function DemoFlow() {
  const [state, setState] = useState<DemoState>({ step: 'idle', log: [] })

  function log(msg: string) {
    setState(s => ({ ...s, log: [...s.log, msg], error: undefined }))
  }

  function err(msg: string) {
    setState(s => ({ ...s, error: msg }))
  }

  async function generateKeypair() {
    const privateKey = ed.utils.randomSecretKey()
    const publicKey = await ed.getPublicKeyAsync(privateKey)
    const did = didFromPublicKey(publicKey)
    setState(s => ({
      ...s, step: 'generated', privateKey, did, error: undefined,
      log: [...s.log, `Generated Ed25519 keypair`, `DID: ${did.slice(0, 46)}…`],
    }))
  }

  async function register() {
    if (!state.did) return
    try {
      const res = await fetch('/api/passport/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did, name: 'Demo Agent' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({
        ...s, step: 'registered', handle: data.handle,
        claimToken: data._devClaimToken, error: undefined,
        log: [...s.log, `Registered — handle: ${data.handle}`, data._devClaimToken ? `Dev claim token ready` : `Check email for claim link`],
      }))
    } catch (e) { err(String(e)) }
  }

  async function claim() {
    if (!state.claimToken) {
      setState(s => ({ ...s, step: 'claimed', log: [...s.log, `Skipping claim (no email configured)` ] }))
      return
    }
    try {
      const res = await fetch('/api/passport/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.claimToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({ ...s, step: 'claimed', error: undefined, log: [...s.log, `Passport claimed ✓`] }))
    } catch (e) { err(String(e)) }
  }

  async function getChallenge() {
    if (!state.did) return
    try {
      const res = await fetch('/api/passport/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({ ...s, step: 'challenged', nonce: data.nonce, error: undefined,
        log: [...s.log, `Got nonce: ${data.nonce.slice(0, 16)}…`] }))
    } catch (e) { err(String(e)) }
  }

  async function getToken() {
    if (!state.did || !state.nonce || !state.privateKey) return
    try {
      const nonceBytes = Buffer.from(state.nonce, 'hex')
      const signature = await ed.signAsync(nonceBytes, state.privateKey)
      const sigB64 = Buffer.from(signature).toString('base64')
      log(`Signed nonce with private key`)

      const res = await fetch('/api/passport/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: state.did, nonce: state.nonce, signature: sigB64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const payloadB64 = data.token.split('.')[1]
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

      setState(s => ({
        ...s, step: 'tokenized', token: data.token, tokenPayload: payload, error: undefined,
        log: [...s.log, `Token issued (expires ${data.expiresAt})`],
      }))
    } catch (e) { err(String(e)) }
  }

  async function verifyViaJwks() {
    if (!state.token) return
    try {
      const jwksRes = await fetch('/.well-known/jwks.json')
      const jwks = await jwksRes.json()
      const jwkKey = jwks.keys[0]

      const cryptoKey = await crypto.subtle.importKey(
        'jwk', jwkKey, { name: 'Ed25519' }, false, ['verify']
      )

      const [headerB64, payloadB64, sigB64] = state.token.split('.')
      const signingInput = `${headerB64}.${payloadB64}`
      const sigBytes = Uint8Array.from(
        atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)
      )
      const msgBytes = new TextEncoder().encode(signingInput)
      const valid = await crypto.subtle.verify({ name: 'Ed25519' }, cryptoKey, sigBytes, msgBytes)

      setState(s => ({
        ...s, step: 'verified', jwksKey: jwkKey, error: undefined,
        log: [...s.log, `Fetched JWKS from /.well-known/jwks.json`, `Signature valid: ${valid} ✓`],
      }))
    } catch (e) { err(String(e)) }
  }

  const steps = [
    { to: 'generated' as Step,  label: '1. Generate keypair',    action: generateKeypair, ready: true,                          btn: 'Generate'       },
    { to: 'registered' as Step, label: '2. Register DID',        action: register,        ready: state.step === 'generated',    btn: 'Register'       },
    { to: 'claimed' as Step,    label: '3. Claim passport',      action: claim,           ready: state.step === 'registered',   btn: 'Claim'          },
    { to: 'challenged' as Step, label: '4. Request challenge',   action: getChallenge,    ready: state.step === 'claimed',      btn: 'Get nonce'      },
    { to: 'tokenized' as Step,  label: '5. Sign & get token',    action: getToken,        ready: state.step === 'challenged',   btn: 'Sign & exchange'},
    { to: 'verified' as Step,   label: '6. Verify via JWKS',     action: verifyViaJwks,   ready: state.step === 'tokenized',    btn: 'Verify'         },
  ]

  const currentIdx = STEP_ORDER.indexOf(state.step)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        {steps.map((s, i) => {
          const done = currentIdx > i
          const active = STEP_ORDER[currentIdx] === s.to
          return (
            <div key={s.to} className="flex items-center gap-4 rounded-lg border p-4">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${done ? 'bg-green-500 text-white' : active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                {s.to === 'registered' && state.handle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">→ {state.handle}</p>
                )}
              </div>
              {!done && (
                <Button size="sm" onClick={s.action} disabled={!s.ready}>
                  {s.btn}
                </Button>
              )}
              {done && <Badge variant="outline" className="text-green-600 border-green-300 shrink-0">Done</Badge>}
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border bg-zinc-950 p-4 font-mono text-xs text-zinc-300 min-h-[160px]">
          {state.log.length === 0
            ? <span className="text-zinc-600">Waiting for first step…</span>
            : state.log.map((line, i) => (
                <div key={i} className="leading-6">
                  <span className="text-zinc-600 mr-2">›</span>{line}
                </div>
              ))
          }
          {state.error && (
            <div className="mt-2 text-red-400">✗ {state.error}</div>
          )}
        </div>

        {state.tokenPayload && (
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">JWT payload</p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(state.tokenPayload, null, 2)}</pre>
          </div>
        )}

        {state.jwksKey && (
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Registry JWKS public key</p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(state.jwksKey, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
