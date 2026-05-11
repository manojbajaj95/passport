import { Resend } from 'resend'

function buildClaimEmail(handle: string, magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claim your agent passport</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <span style="display:inline-block;background:#0d9488;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:6px 14px;border-radius:99px;">Agent Passport</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);">

              <!-- Title -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3;">
                Claim your passport
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                An agent was registered with your email as owner. Confirm to take ownership.
              </p>

              <!-- Handle chip -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 20px;">
                    <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#0d9488;letter-spacing:0.08em;text-transform:uppercase;">Handle</p>
                    <p style="margin:0;font-size:20px;font-weight:700;color:#0f172a;font-family:'Courier New',Courier,monospace;letter-spacing:0.02em;">${handle}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${magicLink}"
                       style="display:inline-block;background:#0d9488;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.01em;">
                      Claim ownership →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Button not working? Copy this link:</p>
              <p style="margin:0;font-size:12px;color:#0d9488;word-break:break-all;">
                <a href="${magicLink}" style="color:#0d9488;">${magicLink}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 0;" align="center">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">This link expires in <strong style="color:#64748b;">24 hours</strong> and can only be used once.</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't expect this, you can safely ignore it.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function getResend(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
}

export async function sendClaimEmail(
  to: string,
  handle: string,
  token: string,
  baseUrl: string
): Promise<void> {
  const magicLink = `${baseUrl}/claim?token=${token}`

  const resend = getResend()
  if (!resend) {
    console.log(`\n[DEV] Claim link for ${handle}:\n${magicLink}\n`)
    return
  }

  const from = process.env.EMAIL_FROM ?? 'Agent Passport <onboarding@resend.dev>'

  await resend.emails.send({
    from,
    to,
    subject: `Claim your agent passport: ${handle}`,
    html: buildClaimEmail(handle, magicLink),
  })
}
