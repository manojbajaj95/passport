export type PassportStatus = 'UNCLAIMED' | 'CLAIMED' | 'REVOKED'

export interface PassportSummary {
  did: string
  handle: string
  name: string | null
  status: PassportStatus
  createdAt: string
  ownerEmail: string | null
}

export interface PassportDetail {
  did: string
  handle: string
  publicKey: string
  status: PassportStatus
  ownerEmail: string | null
  name: string | null
  description: string | null
  createdAt: string
  claimedAt: string | null
}
