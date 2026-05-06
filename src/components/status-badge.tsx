import { Badge } from '@/components/ui/badge'
import type { PassportStatus } from '@/types/passport'

const config: Record<PassportStatus, { label: string; className: string }> = {
  UNCLAIMED: {
    label: 'Unclaimed',
    className: 'border-amber-300 bg-amber-100 text-amber-950',
  },
  CLAIMED: {
    label: 'Claimed',
    className: 'border-teal-300 bg-teal-100 text-teal-950',
  },
  REVOKED: {
    label: 'Revoked',
    className: 'border-red-300 bg-red-100 text-red-950',
  },
}

export function StatusBadge({ status }: { status: PassportStatus }) {
  const { label, className } = config[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}
