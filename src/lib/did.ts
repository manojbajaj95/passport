import { base58 } from '@scure/base'

const ED25519_PREFIX = new Uint8Array([0xed, 0x01])

export function extractPublicKeyFromDid(did: string): Uint8Array {
  if (!did.startsWith('did:key:z')) {
    throw new Error('Only did:key with base58btc encoding (z prefix) is supported')
  }
  const encoded = did.slice('did:key:z'.length)
  const decoded = base58.decode(encoded)
  if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error('DID key is not Ed25519 — expected multicodec prefix 0xed 0x01')
  }
  return decoded.slice(2)
}

export function didFromPublicKey(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array(2 + publicKey.length)
  prefixed.set(ED25519_PREFIX, 0)
  prefixed.set(publicKey, 2)
  return `did:key:z${base58.encode(prefixed)}`
}
