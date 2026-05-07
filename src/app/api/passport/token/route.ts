import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signPassportToken } from '@/lib/jwt'
import { extractPublicKeyFromDid } from '@/lib/did'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { did, nonce, signature } = body

  if (!did || !nonce || !signature) {
    return NextResponse.json(
      { error: 'did, nonce, and signature are required' },
      { status: 400 }
    )
  }

  const nonceRecord = await prisma.nonce.findUnique({ where: { nonce } })

  if (!nonceRecord || nonceRecord.did !== did) {
    return NextResponse.json({ error: 'invalid_nonce' }, { status: 400 })
  }
  if (nonceRecord.usedAt) {
    return NextResponse.json({ error: 'nonce_already_used' }, { status: 400 })
  }
  if (nonceRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: 'nonce_expired' }, { status: 400 })
  }

  let publicKeyBytes: Uint8Array
  try {
    publicKeyBytes = extractPublicKeyFromDid(did)
  } catch {
    return NextResponse.json({ error: 'invalid_did' }, { status: 400 })
  }

  const nonceBytes = Buffer.from(nonce, 'hex')
  const sigBytes = Buffer.from(signature, 'base64')
  const valid = await verifyEd25519(publicKeyBytes, nonceBytes, sigBytes)

  if (!valid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  await prisma.nonce.update({ where: { nonce }, data: { usedAt: new Date() } })

  const passport = await prisma.passport.findUniqueOrThrow({ where: { did } })
  const { token, expiresAt } = await signPassportToken(
    did,
    passport.handle,
    passport.status === 'CLAIMED'
  )

  return NextResponse.json({ token, expiresAt })
}

async function verifyEd25519(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(publicKey),
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    return await crypto.subtle.verify({ name: 'Ed25519' }, key, Buffer.from(signature), Buffer.from(message))
  } catch {
    return false
  }
}
