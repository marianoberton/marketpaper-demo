export const SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referido' },
  { value: 'web-form', label: 'Formulario web' },
  { value: 'cold-outreach', label: 'Contacto directo' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'otro', label: 'Otro' },
] as const

export const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  SOURCE_OPTIONS.map(o => [o.value, o.label])
)
