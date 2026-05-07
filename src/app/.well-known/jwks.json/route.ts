import { NextResponse } from 'next/server'
import { getServerKeys } from '@/lib/server-keys'

export async function GET() {
  const { publicKeyJwk } = await getServerKeys()
  return NextResponse.json({
    keys: [{ ...publicKeyJwk, kid: 'passport-v1', use: 'sig', alg: 'EdDSA' }],
  })
}
