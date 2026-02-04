import { redirect } from 'next/navigation'

// Viewers no tienen acceso a soporte - redirigir al portal principal
export default async function TicketsPage() {
  redirect('/client-view')
}
