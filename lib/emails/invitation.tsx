import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from '@react-email/components'

interface InvitationEmailProps {
  inviteUrl: string
  companyName: string
  role: string
  invitedByName?: string
}

const ROLE_LABELS: Record<string, string> = {
  company_owner: 'Propietario',
  company_admin: 'Administrador',
  manager: 'Manager',
  employee: 'Colaborador',
  viewer: 'Viewer (solo lectura)',
}

export function InvitationEmail({
  inviteUrl = 'https://app.fomoplatform.com/invite/accept?token=xxx',
  companyName = 'INTED',
  role = 'company_admin',
  invitedByName = 'Juan Perez',
}: InvitationEmailProps) {
  const roleLabel = ROLE_LABELS[role] || role

  return (
    <Html>
      <Head />
      <Preview>Te invitaron a {companyName} en FOMO Platform</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://plataforma.fomo.com.ar/logos/horizontalSVG-white.svg"
              width="120"
              height="40"
              alt="FOMO"
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Text style={heading}>Te invitaron a unirte</Text>

            <Text style={paragraph}>
              {invitedByName ? `${invitedByName} te invito` : 'Te invitaron'} a unirte a{' '}
              <strong>{companyName}</strong> en FOMO Platform como{' '}
              <strong>{roleLabel}</strong>.
            </Text>

            <Text style={paragraph}>
              FOMO es una plataforma empresarial donde vas a poder gestionar tu trabajo
              de forma moderna, segura y centralizada.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Aceptar invitacion
              </Button>
            </Section>

            <Text style={smallText}>
              Si no esperabas esta invitacion, podes ignorar este email.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              FOMO Platform &middot; Plataforma empresarial inteligente
            </Text>
            <Text style={footerText}>
              Datos seguros y privados &middot; Cifrado AES-256
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Export default para React Email Dev
export default InvitationEmail

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '560px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
}

const logoSection = {
  backgroundColor: '#1C1C1C',
  padding: '24px 32px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const content = {
  padding: '32px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4a4a4a',
  margin: '0 0 16px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#CED600',
  color: '#1a1a1a',
  padding: '12px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}

const smallText = {
  fontSize: '13px',
  color: '#999999',
  margin: '0',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '0',
}

const footer = {
  padding: '24px 32px',
}

const footerText = {
  fontSize: '12px',
  color: '#999999',
  margin: '0 0 4px',
  textAlign: 'center' as const,
}
