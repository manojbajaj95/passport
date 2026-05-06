export type PassportStatus = 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'

export interface PassportSummary {
  id: string
  name: string | null
  status: PassportStatus
  createdAt: string
  ownerEmail: string | null
}

export interface PassportDetail {
  id: string
  publicKey: string
  status: PassportStatus
  ownerEmail: string | null
  name: string | null
  description: string | null
  tags: Record<string, string> | null
  createdAt: string
  claimedAt: string | null
}
