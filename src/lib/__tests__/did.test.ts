import { describe, it, expect } from 'vitest'
import { extractPublicKeyFromDid, didFromPublicKey } from '../did'

describe('extractPublicKeyFromDid', () => {
  it('extracts 32-byte public key from a valid did:key', () => {
    const key = new Uint8Array(32).fill(42)
    const did = didFromPublicKey(key)
    const extracted = extractPublicKeyFromDid(did)
    expect(extracted).toBeInstanceOf(Uint8Array)
    expect(extracted.length).toBe(32)
  })

  it('throws on non-did:key input', () => {
    expect(() => extractPublicKeyFromDid('did:web:example.com')).toThrow()
  })

  it('throws on did:key with non-Ed25519 key type', () => {
    expect(() => extractPublicKeyFromDid('did:key:zabc123')).toThrow()
  })
})

describe('didFromPublicKey', () => {
  it('round-trips: encode then decode yields same key', () => {
    const original = new Uint8Array(32).fill(42)
    const did = didFromPublicKey(original)
    const recovered = extractPublicKeyFromDid(did)
    expect(recovered).toEqual(original)
  })

  it('produces a string starting with did:key:z', () => {
    const key = new Uint8Array(32).fill(1)
    expect(didFromPublicKey(key)).toMatch(/^did:key:z/)
  })
})
