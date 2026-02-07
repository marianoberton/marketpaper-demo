import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from '@react-email/components'

interface PasswordResetEmailProps {
  resetUrl: string
  userName?: string
}

export function PasswordResetEmail({
  resetUrl = 'https://app.fomoplatform.com/reset-password?token=xxx',
  userName = 'Carlos Gomez',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contrasena en FOMO Platform</Preview>
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
            <Text style={heading}>Restablecer contrasena</Text>

            <Text style={paragraph}>
              {userName ? `Hola ${userName}, recibimos` : 'Recibimos'} una solicitud
              para restablecer tu contrasena en FOMO Platform.
            </Text>

            <Text style={paragraph}>
              Hace clic en el boton de abajo para crear una nueva contrasena.
              Este enlace expira en 1 hora.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Restablecer contrasena
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                Si no solicitaste este cambio, podes ignorar este email.
                Tu contrasena no se modificara.
              </Text>
            </Section>
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
export default PasswordResetEmail

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

const warningBox = {
  backgroundColor: '#fff8e1',
  borderRadius: '8px',
  padding: '16px 20px',
  border: '1px solid #ffe082',
}

const warningText = {
  fontSize: '13px',
  color: '#795548',
  margin: '0',
  lineHeight: '20px',
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
