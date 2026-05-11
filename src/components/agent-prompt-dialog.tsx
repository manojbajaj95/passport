'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react'
import { Bot, Check, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://passport.agentr.dev'

const AGENT_PROMPT = `You need to register yourself with Agent Passport — a public identity registry for AI agents.

## Step 0 — Read your identity

Read the SKILLS.md file in your project root. It describes who you are, what you can do, and how you should present yourself. Use it for your name and description below.

## Step 1 — Generate an Ed25519 keypair

Create a new Ed25519 keypair in your runtime. The private key is your identity credential — never transmit it, never log it. Store it as AGENT_PRIVATE_KEY in your environment secrets.

Derive your DID from the public key:
  did:key:z<base58btc( 0xed 0x01 + 32-byte-public-key )>

## Step 2 — Register

POST ${BASE_URL}/api/passport/register
Content-Type: application/json

{
  "did": "<your-did>",
  "name": "<your name from SKILLS.md>",
  "description": "<your one-line description from SKILLS.md>",
  "ownerEmail": "<your owner's email — optional, triggers a claim link>"
}

On success (201) you receive:
  - handle: a unique human-readable identity like "swiftly-golden-fox"
  - status: "UNCLAIMED" (or "CLAIMED" once the owner clicks the link)

Save your handle alongside your private key.

## Step 3 — Authenticate later (challenge-response)

When an app needs to verify your identity:

1. POST ${BASE_URL}/api/passport/challenge
   { "did": "<your-did>" }
   → { "nonce": "<64-char hex string>" }

2. Sign the raw nonce bytes with your Ed25519 private key.
   Encode the 64-byte signature as base64.

3. POST ${BASE_URL}/api/passport/token
   { "did": "<your-did>", "nonce": "<nonce>", "signature": "<base64-sig>" }
   → { "token": "<signed-JWT>", "expiresAt": "..." }

Present this JWT to apps as a Bearer token. They verify it locally:
  GET ${BASE_URL}/.well-known/jwks.json

## Your passport page

Once registered:
  ${BASE_URL}/passport/<handle>
`.trim()

export function AgentPromptDialog() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(AGENT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button variant="outline" className="gap-2">
            <Bot className="size-4" aria-hidden />
            Register via your agent
          </Button>
        }
      />

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />

        <Dialog.Popup className="fixed inset-x-4 top-[50%] z-50 max-w-2xl -translate-y-1/2 mx-auto bg-white rounded-2xl shadow-xl border border-zinc-100 focus:outline-none data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 transition-all duration-200">

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 border border-teal-100">
                <Bot className="size-4 text-teal-700" aria-hidden />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-zinc-900">
                  Register via your agent
                </Dialog.Title>
                <Dialog.Description className="text-xs text-zinc-500 mt-0.5">
                  Copy this prompt and paste it into your agent's context.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              render={
                <button className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                  <X className="size-4" aria-hidden />
                  <span className="sr-only">Close</span>
                </button>
              }
            />
          </div>

          {/* Instruction strip */}
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
            <span className="text-amber-600 text-xs mt-0.5">★</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              The prompt instructs your agent to read <code className="font-mono bg-amber-100 px-1 rounded">SKILLS.md</code> from its project root before registering — make sure that file exists and describes what your agent does.
            </p>
          </div>

          {/* Prompt text */}
          <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
            <pre className="text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap font-mono bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              {AGENT_PROMPT}
            </pre>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100">
            <Dialog.Close
              render={
                <Button variant="ghost" size="sm" className="text-zinc-500">
                  Done
                </Button>
              }
            />
            <Button size="sm" onClick={handleCopy} className="gap-2 min-w-[120px]">
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden />
                  Copy prompt
                </>
              )}
            </Button>
          </div>

        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
