import { DemoFlow } from '@/components/demo-flow'

export default function DemoPage() {
  return (
    <div className="space-y-8">
      <section className="demo-panel p-8 sm:p-10">
        <p className="eyebrow">Live demo</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Agent identity in action.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground max-w-2xl">
          This demo runs entirely in your browser. Your private key is generated locally and never
          sent to the server — only a signature over a challenge nonce is transmitted.
        </p>
      </section>
      <DemoFlow />
    </div>
  )
}
