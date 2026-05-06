'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { BadgeCheck, BookOpen, Fingerprint, KeyRound, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import type { PassportStatus } from '@/types/passport'

interface PassportBookProps {
  id: string
  name: string
  description: string
  publicKey: string
  ownerEmail: string
  status: PassportStatus
  issued: string
  expires: string
  machineLine: string
}

export function PassportBook({
  id,
  name,
  description,
  publicKey,
  ownerEmail,
  status,
  issued,
  expires,
  machineLine,
}: PassportBookProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Passport document</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
        </div>
        <Button variant="outline" className="bg-white/75" onClick={() => setOpen((value) => !value)}>
          {open ? <RotateCcw className="size-4" aria-hidden /> : <BookOpen className="size-4" aria-hidden />}
          {open ? 'Close Passport' : 'Open Passport'}
        </Button>
      </div>

      <div className="relative min-h-[620px] overflow-hidden rounded-lg border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(240,253,250,0.52))] p-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(15,23,42,0.05)_0_1px,transparent_1px_48px)]" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center justify-center [perspective:1800px]">
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className={`absolute left-1/2 top-1/2 z-10 h-[520px] w-[340px] rounded-xl border border-teal-100/30 bg-[linear-gradient(145deg,#0f172a,#0f4c46_58%,#111827)] p-7 text-left text-white shadow-[0_34px_90px_rgba(15,23,42,0.38)] [backface-visibility:visible] [transform-origin:left_center] [transform-style:preserve-3d] ${open ? 'pointer-events-none' : ''}`}
            initial={false}
            animate={{
              x: open ? '-50%' : '-50%',
              y: open ? '-50%' : '-50%',
              rotateY: open ? -178 : 0,
              opacity: open ? 0 : 1,
            }}
            whileHover={open ? undefined : { y: '-51%', rotateY: -5 }}
            transition={{
              rotateY: { type: 'spring', stiffness: 82, damping: 18, mass: 0.9 },
              opacity: { duration: open ? 0.42 : 0.2, ease: 'easeOut', delay: open ? 0.16 : 0 },
            }}
            style={{ transformPerspective: 1800 }}
            aria-label="Open passport"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-teal-100">Agent Passport</span>
                  <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-teal-50">AI</span>
                </div>
                <div className="mt-20 flex justify-center">
                  <div className="relative flex size-36 items-center justify-center rounded-full border border-teal-100/45 bg-white/10 shadow-inner">
                    <div className="absolute inset-5 rounded-full border border-amber-200/30" />
                    <Fingerprint className="size-16 text-teal-100" aria-hidden />
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <p className="font-mono text-xs uppercase text-teal-100">Identity Document</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{name}</p>
                </div>
              </div>
              <div>
                <div className="h-px bg-white/20" />
                <p className="mt-5 text-sm text-teal-50/80">Click to open</p>
              </div>
            </div>
          </motion.button>

          <div className={`grid w-full max-w-6xl gap-0 transition-all duration-700 lg:grid-cols-2 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <section className="min-h-[530px] rounded-t-xl border border-zinc-300 bg-[linear-gradient(180deg,#fff7ed,#fffaf0_48%,#f8fafc)] p-7 text-zinc-950 shadow-[inset_-18px_0_34px_rgba(15,23,42,0.08)] lg:rounded-l-xl lg:rounded-r-none lg:border-r-0">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-300 pb-5">
                <div>
                  <p className="font-mono text-xs uppercase text-zinc-500">Passport holder</p>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight">{name}</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">{description}</p>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-[150px_1fr]">
                <div className="flex aspect-[3/4] items-center justify-center rounded-md border border-zinc-300 bg-[linear-gradient(145deg,#0f172a,#115e59)] shadow-inner">
                  <Fingerprint className="size-16 text-teal-100" aria-hidden />
                </div>
                <div className="grid gap-4">
                  <Field label="Agent ID" value={id} mono />
                  <Field label="Owner" value={ownerEmail} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Issued" value={issued} />
                    <Field label="Valid until" value={expires} />
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-md border border-zinc-300 bg-white/82 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-zinc-500">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verification note
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  This passport binds a readable agent identity to a public key and a human ownership claim.
                </p>
              </div>
            </section>

            <section className="flex min-h-[530px] flex-col rounded-b-xl border border-zinc-300 bg-[linear-gradient(180deg,#f8fafc,#ecfeff)] p-7 text-zinc-950 shadow-[inset_18px_0_34px_rgba(15,23,42,0.08)] lg:rounded-l-none lg:rounded-r-xl">
              <div className="flex items-center justify-between border-b border-zinc-300 pb-5">
                <div>
                  <p className="font-mono text-xs uppercase text-zinc-500">Cryptographic page</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">Public credentials</h2>
                </div>
                <div className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-center shadow-sm">
                  <div className="font-mono text-[10px] uppercase text-zinc-500">Type</div>
                  <div className="text-2xl font-semibold">AI</div>
                </div>
              </div>

              <div className="mt-7 rounded-md border border-zinc-300 bg-white p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-zinc-500">
                  <KeyRound className="size-3.5" aria-hidden />
                  Public key
                </div>
                <div className="mt-3 break-all font-mono text-xs leading-5 text-zinc-700">{publicKey}</div>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-4">
                <div className="rounded-md border border-zinc-300 bg-white/78 p-4">
                  <p className="font-mono text-[10px] uppercase text-zinc-500">Issuer</p>
                  <p className="mt-2 text-lg font-semibold">Agent Passport Authority</p>
                </div>
                <div className="rounded-md border border-zinc-300 bg-white/78 p-4">
                  <p className="font-mono text-[10px] uppercase text-zinc-500">Document</p>
                  <p className="mt-2 text-lg font-semibold">Verified agent</p>
                </div>
              </div>

              <div className="mt-auto border-t border-zinc-300 pt-5 font-mono text-sm leading-7 text-zinc-700">
                <div>{machineLine.slice(0, 44).padEnd(44, '<')}</div>
                <div>{machineLine.slice(44, 88).padEnd(44, '<')}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase text-zinc-500">{label}</div>
      <div className={`mt-1 break-all text-lg font-semibold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}
