import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InitForm } from '@/components/init-form'

export default function InitPage() {
  return (
    <div className="w-full bg-background min-h-screen flex flex-col">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12 flex-1 w-full flex flex-col items-center">
        <div className="w-full mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-label-uppercase text-body hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" aria-hidden />
            BACK TO HOME
          </Link>
        </div>
        
        <div className="w-full flex justify-center mt-12">
          <InitForm />
        </div>
      </div>
    </div>
  )
}
