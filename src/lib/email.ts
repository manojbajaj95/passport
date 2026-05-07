import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendClaimEmail(
  to: string,
  handle: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const magicLink = `${baseUrl}/claim?token=${token}`

  if (!resend) {
    console.log(`\n[DEV] Claim link for ${handle}:\n${magicLink}\n`)
    return
  }

  await resend.emails.send({
    from: 'passport@yourdomain.com',
    to,
    subject: `Claim your agent passport: ${handle}`,
    html: `
      <p>An agent has been registered with your email as owner.</p>
      <p><strong>Handle:</strong> ${handle}</p>
      <p>Click to confirm ownership (expires in 24 hours):</p>
      <p><a href="${magicLink}">${magicLink}</a></p>
    `,
  })
}
