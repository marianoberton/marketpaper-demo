/**
 * Slack notification helpers for ticket system
 * These functions send notifications to Slack when ticket events occur
 */

interface TicketForSlack {
  id: string
  subject: string
  slack_thread_ts?: string | null
}

interface ResponderProfile {
  full_name?: string | null
  email?: string
}

/**
 * Sends a notification to Slack when an admin responds to a ticket
 * If the ticket has a slack_thread_ts, it will reply in the same thread
 */
export async function notifySlackTicketResponse(
  ticket: TicketForSlack,
  responseText: string,
  responder: ResponderProfile
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.log('[Slack] No webhook URL configured, skipping notification')
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const responderName = responder.full_name || responder.email || 'Soporte'

  // Truncate response text if too long
  const truncatedText = responseText.length > 500
    ? responseText.substring(0, 500) + '...'
    : responseText

  try {
    const payload: Record<string, unknown> = {
      text: `Nueva respuesta en ticket: ${ticket.subject}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Respuesta de ${responderName}* en ticket _"${ticket.subject}"_`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: truncatedText
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ver Ticket',
                emoji: true
              },
              url: `${appUrl}/admin/tickets/${ticket.id}`,
              style: 'primary'
            }
          ]
        }
      ]
    }

    // If we have a thread_ts, reply in the same thread
    if (ticket.slack_thread_ts) {
      payload.thread_ts = ticket.slack_thread_ts
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('[Slack] Failed to send notification:', response.status, await response.text())
    } else {
      console.log(`[Slack] Ticket response notification sent for ticket: ${ticket.id}`)
    }
  } catch (error) {
    console.error('[Slack] Error sending notification:', error)
  }
}

/**
 * Sends a notification to Slack when a ticket status changes
 */
export async function notifySlackTicketStatusChange(
  ticket: TicketForSlack,
  newStatus: string,
  changedBy: ResponderProfile
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const statusLabels: Record<string, string> = {
    open: 'Abierto',
    in_progress: 'En Progreso',
    waiting_user: 'Esperando Usuario',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  }

  const statusEmojis: Record<string, string> = {
    open: ':large_blue_circle:',
    in_progress: ':hourglass_flowing_sand:',
    waiting_user: ':speech_balloon:',
    resolved: ':white_check_mark:',
    closed: ':lock:'
  }

  try {
    const payload: Record<string, unknown> = {
      text: `Ticket actualizado: ${ticket.subject}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmojis[newStatus] || ':ticket:'} Ticket _"${ticket.subject}"_ cambio a *${statusLabels[newStatus] || newStatus}*`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Actualizado por: ${changedBy.full_name || changedBy.email || 'Sistema'}`
            }
          ]
        }
      ]
    }

    if (ticket.slack_thread_ts) {
      payload.thread_ts = ticket.slack_thread_ts
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error('[Slack] Error sending status change notification:', error)
  }
}
