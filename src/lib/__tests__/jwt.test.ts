import { describe, it, expect } from 'vitest'
import { signPassportToken, decodePassportToken } from '../jwt'

describe('signPassportToken', () => {
  it('returns a signed JWT string and ISO expiresAt', async () => {
    const { token, expiresAt } = await signPassportToken(
      'did:key:z6Mk123',
      'swiftly-golden-fox',
      true
    )
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now())
  })
})

describe('decodePassportToken', () => {
  it('round-trips: sign then decode yields same claims', async () => {
    const did = 'did:key:z6Mk456'
    const handle = 'quietly-brave-crane'
    const { token } = await signPassportToken(did, handle, false)
    const payload = await decodePassportToken(token)
    expect(payload.sub).toBe(did)
    expect(payload.handle).toBe(handle)
    expect(payload.claimed).toBe(false)
  })
})
