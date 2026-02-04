import { redirect } from 'next/navigation'

// Viewers no tienen acceso a soporte - redirigir al portal principal
export default async function TicketDetailPage() {
  redirect('/client-view')
}
