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

function GuillocheBackground({ className = '' }: { className?: string }) {
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full opacity-10 mix-blend-overlay ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="guilloche" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
          <path d="M 0 50 Q 25 0 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M 0 50 Q 25 100 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M 50 0 Q 100 25 50 50 T 50 100" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M 50 0 Q 0 25 50 50 T 50 100" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#guilloche)" />
    </svg>
  )
}

function PassportStamp({ date, color, text, angle, className, sysOk = true }: { date: string, color: 'red' | 'blue' | 'green', text: string, angle: number, className?: string, sysOk?: boolean }) {
  const colors = {
    red: "border-destructive/60 text-destructive/60",
    blue: "border-stripe-2/60 text-stripe-2/60",
    green: "border-success/60 text-success/60"
  }
  return (
    <div className={`pointer-events-none absolute mix-blend-screen ${className}`} style={{ transform: `rotate(${angle}deg)` }}>
      <div className={`flex size-28 items-center justify-center rounded-full border-[3px] border-double ${colors[color]}`}>
        <div className="absolute inset-1.5 rounded-full border border-dashed opacity-40" />
        <div className="text-center font-bmw-display font-bold uppercase tracking-[1.5px]">
          <div className="text-[10px] opacity-90">{text}</div>
          <div className="my-1 border-y border-current py-1 text-[11px]">{date}</div>
          {sysOk && <div className="text-[8px] opacity-90 tracking-[2px]">SYS // OK</div>}
        </div>
      </div>
    </div>
  )
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-label-uppercase text-body mb-2 tracking-[1.5px] uppercase">PASSPORT DOCUMENT</p>
          <h1 className="text-display-md text-foreground uppercase">{name}</h1>
        </div>
        <Button onClick={() => setOpen((value) => !value)}>
          {open ? <RotateCcw className="size-4 mr-2" aria-hidden /> : <BookOpen className="size-4 mr-2" aria-hidden />}
          {open ? 'CLOSE PASSPORT' : 'OPEN PASSPORT'}
        </Button>
      </div>

      <div className="relative min-h-[620px] bg-surface-card border border-hairline p-4 sm:p-8 flex items-center justify-center overflow-hidden">
        {/* Background gradient abstract shape */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-[400px] bg-surface-elevated blur-3xl opacity-50 rounded-full" />
        
        <div className="relative mx-auto flex min-h-[560px] w-full max-w-6xl items-center justify-center [perspective:1800px]">
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className={`absolute left-1/2 top-1/2 z-10 h-[520px] w-[340px] border border-stripe-2/30 bg-[linear-gradient(145deg,#0a192f,#0f4c46_58%,#020617)] p-8 text-left shadow-[0_20px_60px_rgba(0,0,0,0.8)] [backface-visibility:visible] [transform-origin:left_center] [transform-style:preserve-3d] ${open ? 'pointer-events-none' : ''}`}
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
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stripe-1 via-stripe-2 to-stripe-3" />
            
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bmw-display text-[12px] uppercase tracking-[1.5px] text-stripe-1">AGENT PASSPORT</span>
                  <span className="font-bmw-display text-[12px] uppercase tracking-[1.5px] text-white border border-white/20 px-2 py-1">AI</span>
                </div>
                <div className="mt-24 flex justify-center">
                  <div className="relative flex size-32 items-center justify-center rounded-full border border-stripe-1/30 bg-black/40 shadow-inner backdrop-blur-sm">
                     <div className="absolute inset-4 rounded-full border border-stripe-3/30" />
                    <Fingerprint className="size-16 text-stripe-2 opacity-80" aria-hidden />
                  </div>
                </div>
                <div className="mt-16 text-center">
                  <p className="font-bmw-display text-[12px] uppercase tracking-[1.5px] text-stripe-1">IDENTITY DOCUMENT</p>
                  <p className="mt-3 text-title-lg text-white uppercase">{name}</p>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-caption text-stripe-1 text-center">CLICK TO OPEN</p>
              </div>
            </div>
          </motion.button>

          <div className={`grid w-full max-w-6xl gap-0 transition-all duration-700 lg:grid-cols-2 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <section className="relative overflow-hidden min-h-[530px] border border-hairline bg-[linear-gradient(135deg,#1e293b,#0f172a)] p-8 lg:border-r-0 flex flex-col justify-between shadow-[inset_-20px_0_40px_rgba(0,0,0,0.4)]">
              <GuillocheBackground className="text-stripe-1" />
              
              <div className="absolute -bottom-32 -left-32 opacity-10 pointer-events-none text-stripe-2">
                <Fingerprint className="size-[500px]" aria-hidden />
              </div>

              <div className="relative z-10">
                <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <p className="text-label-uppercase text-stripe-1 tracking-[1.5px]">PASSPORT HOLDER</p>
                    <h2 className="mt-3 text-display-sm text-white uppercase">{name}</h2>
                    <p className="mt-4 max-w-md text-body-sm text-slate-300 font-light leading-relaxed">{description}</p>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={status} />
                  </div>
                </div>

                <div className="relative mt-8 grid gap-8 sm:grid-cols-[160px_1fr]">
                  <div className="relative overflow-hidden flex aspect-[3/4] items-center justify-center border border-white/10 bg-[linear-gradient(145deg,#020617,#0f4c46)] shadow-inner">
                    <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.1)_25%,transparent_30%)] mix-blend-overlay" />
                    <Fingerprint className="size-20 text-stripe-1 opacity-70" aria-hidden />
                  </div>
                  <div className="grid gap-6">
                    <Field label="AGENT ID" value={id} mono textClass="text-white" labelClass="text-stripe-1" />
                    <Field label="OWNER" value={ownerEmail} textClass="text-white" labelClass="text-stripe-1" />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="ISSUED" value={issued} textClass="text-white" labelClass="text-stripe-1" />
                      <Field label="VALID UNTIL" value={expires} textClass="text-white" labelClass="text-stripe-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-12 border border-stripe-2/20 bg-black/40 backdrop-blur-md p-5 shadow-sm">
                <div className="flex items-center gap-3 text-label-uppercase text-stripe-2 tracking-[1.5px]">
                  <BadgeCheck className="size-4" aria-hidden />
                  VERIFICATION NOTE
                </div>
                <p className="mt-3 text-body-sm text-slate-300 font-light">
                  This passport binds a readable agent identity to a public key and a human ownership claim.
                </p>
              </div>
            </section>

            <section className="relative overflow-hidden flex min-h-[530px] flex-col border border-hairline bg-[linear-gradient(180deg,#1e293b,#0f172a)] p-8 shadow-[inset_20px_0_40px_rgba(0,0,0,0.4)]">
              <GuillocheBackground className="text-stripe-2" />
              
              <PassportStamp date={issued} color="blue" text="ISSUED" angle={-15} className="top-12 right-10" />
              <PassportStamp date="VERIFIED" color="green" text="ENTRY" angle={22} className="top-48 right-20" sysOk={false} />

              <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-6">
                <div>
                  <p className="text-label-uppercase text-stripe-2 tracking-[1.5px]">CRYPTOGRAPHIC PAGE</p>
                  <h2 className="mt-3 text-display-sm text-white uppercase">PUBLIC CREDENTIALS</h2>
                </div>
                <div className="border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 text-center shadow-sm">
                  <div className="text-label-uppercase text-stripe-2 tracking-[1.5px]">TYPE</div>
                  <div className="text-title-lg text-white mt-1">AI</div>
                </div>
              </div>

              <div className="relative z-10 mt-8 border border-white/10 bg-black/20 backdrop-blur-md p-5 shadow-sm">
                <div className="flex items-center gap-3 text-label-uppercase text-white tracking-[1.5px]">
                  <KeyRound className="size-4 text-stripe-3" aria-hidden />
                  PUBLIC KEY
                </div>
                <div className="mt-4 break-all font-mono text-sm text-stripe-1 bg-black/50 border border-white/5 p-3 select-all">
                  {publicKey}
                </div>
              </div>

              <div className="relative z-10 mt-8 grid grid-cols-2 gap-6">
                <div className="border border-white/10 bg-black/20 backdrop-blur-md p-5 shadow-sm">
                  <p className="text-label-uppercase text-stripe-2 tracking-[1.5px]">ISSUER</p>
                  <p className="mt-3 text-title-md text-white uppercase">AGENT PASSPORT AUTHORITY</p>
                </div>
                <div className="border border-white/10 bg-black/20 backdrop-blur-md p-5 shadow-sm">
                  <p className="text-label-uppercase text-stripe-2 tracking-[1.5px]">DOCUMENT</p>
                  <p className="mt-3 text-title-md text-white uppercase">VERIFIED AGENT</p>
                </div>
              </div>

              <div className="relative z-10 mt-auto -mx-8 -mb-8 border-t border-white/10 bg-black/60 p-6 font-mono text-[14px] font-bold tracking-[0.2em] leading-loose text-stripe-2 backdrop-blur-md shadow-inner">
                <div className="whitespace-nowrap">{machineLine.slice(0, 44).padEnd(44, '<')}</div>
                <div className="whitespace-nowrap">{machineLine.slice(44, 88).padEnd(44, '<')}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono = false, textClass = "text-foreground", labelClass = "text-body" }: { label: string; value: string; mono?: boolean, textClass?: string, labelClass?: string }) {
  return (
    <div>
      <div className={`text-label-uppercase tracking-[1.5px] ${labelClass}`}>{label}</div>
      <div className={`mt-2 text-title-sm break-all ${mono ? 'font-mono text-sm' : 'uppercase'} ${textClass}`}>{value}</div>
    </div>
  )
}
