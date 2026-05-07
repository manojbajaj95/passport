import { generateKeyPair, exportJWK, importJWK, type KeyLike } from 'jose'

type ServerKeys = { privateKey: KeyLike; publicKeyJwk: JsonWebKey }

let cached: ServerKeys | null = null

export async function getServerKeys(): Promise<ServerKeys> {
  if (cached) return cached

  if (process.env.SERVER_PRIVATE_KEY) {
    const jwk = JSON.parse(
      Buffer.from(process.env.SERVER_PRIVATE_KEY, 'base64').toString('utf-8')
    )
    const privateKey = await importJWK(jwk, 'EdDSA')
    const { d: _d, ...publicKeyJwk } = jwk
    cached = { privateKey, publicKeyJwk: { ...publicKeyJwk, key_ops: ['verify'] } }
  } else {
    const { privateKey, publicKey } = await generateKeyPair('EdDSA')
    const publicKeyJwk = await exportJWK(publicKey)
    cached = { privateKey, publicKeyJwk: { ...publicKeyJwk, alg: 'EdDSA', use: 'sig' } }
  }

  return cached
}
