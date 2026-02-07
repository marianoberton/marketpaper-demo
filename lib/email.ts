import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FOMO Platform <noreply@fomoplatform.com>'

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY not configured, skipping email send')
    return null
  }

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    react,
  })

  if (error) {
    console.error('[EMAIL] Send error:', error)
    throw error
  }

  return data
}
