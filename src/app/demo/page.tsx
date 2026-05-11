import { DemoFlow } from '@/components/demo-flow'

export default function DemoPage() {
  return (
    <div className="space-y-8">
      <section className="demo-panel relative overflow-hidden p-8 sm:p-10 border border-teal-100 bg-[linear-gradient(135deg,#f0fdfa,#ffffff)] shadow-sm rounded-2xl">
        {/* Decorative pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bg-pattern-demo" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                <path d="M0 50 Q 25 0 50 50 T 100 50 M0 50 Q 25 100 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-pattern-demo)"/>
          </svg>
        </div>

        <div className="relative z-10">
          <p className="font-mono text-xs font-semibold tracking-widest uppercase text-teal-700">Live demo</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl text-zinc-900 drop-shadow-sm">
            Agent identity in action.
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 max-w-2xl">
            This demo runs entirely in your browser. Your private key is generated locally and never
            sent to the server — only a signature over a challenge nonce is transmitted.
          </p>
        </div>
      </section>
      <DemoFlow />
    </div>
  )
}
