import { Badge } from '@/components/ui/badge'
import type { PassportStatus } from '@/types/passport'

const config: Record<PassportStatus, { label: string; className: string }> = {
  UNCLAIMED: {
    label: 'UNCLAIMED',
    className: 'border-warning text-warning bg-transparent rounded-none px-3 py-1 font-bmw-display tracking-[1.5px] uppercase',
  },
  CLAIMED: {
    label: 'CLAIMED',
    className: 'border-success text-success bg-transparent rounded-none px-3 py-1 font-bmw-display tracking-[1.5px] uppercase',
  },
  REVOKED: {
    label: 'REVOKED',
    className: 'border-m-red text-m-red bg-transparent rounded-none px-3 py-1 font-bmw-display tracking-[1.5px] uppercase',
  },
}

export function StatusBadge({ status }: { status: PassportStatus }) {
  const { label, className } = config[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}
