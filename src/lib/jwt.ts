import { SignJWT, jwtVerify, importJWK, type JWTPayload } from 'jose'
import { randomUUID } from 'crypto'
import { getServerKeys } from './server-keys'

const TOKEN_TTL_SECONDS = 3600

export interface PassportTokenPayload extends JWTPayload {
  handle: string
  status: string
  name: string | null
}

function getIssuer(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
}

export async function signPassportToken(
  did: string,
  handle: string,
  status: string,
  name: string | null
): Promise<{ token: string; expiresAt: string }> {
  const { privateKey } = await getServerKeys()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_SECONDS

  const token = await new SignJWT({ handle, status, name })
    .setProtectedHeader({ alg: 'EdDSA', kid: 'passport-v1' })
    .setIssuer(getIssuer())
    .setSubject(did)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(randomUUID())
    .sign(privateKey)

  return { token, expiresAt: new Date(exp * 1000).toISOString() }
}

export async function decodePassportToken(token: string): Promise<PassportTokenPayload> {
  const { publicKeyJwk } = await getServerKeys()
  const publicKey = await importJWK(publicKeyJwk, 'EdDSA')
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: getIssuer(),
    algorithms: ['EdDSA'],
  })
  return payload as PassportTokenPayload
}
