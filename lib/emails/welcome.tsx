import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from '@react-email/components'

interface WelcomeEmailProps {
  userName: string
  companyName: string
  loginUrl: string
}

export function WelcomeEmail({
  userName = 'Maria Rodriguez',
  companyName = 'INTED',
  loginUrl = 'https://app.fomoplatform.com/login',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a FOMO Platform, {userName}</Preview>
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
            <Text style={heading}>Bienvenido a FOMO, {userName}!</Text>

            <Text style={paragraph}>
              Tu cuenta en <strong>{companyName}</strong> esta lista.
              Ya podes acceder a tu workspace y empezar a trabajar.
            </Text>

            <Section style={stepsContainer}>
              <Text style={stepTitle}>Primeros pasos:</Text>
              <Text style={step}>1. Inicia sesion en tu workspace</Text>
              <Text style={step}>2. Explora los modulos disponibles</Text>
              <Text style={step}>3. Configura tu perfil y preferencias</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Ir a mi workspace
              </Button>
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
export default WelcomeEmail

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

const stepsContainer = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '16px 0',
}

const stepTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px',
}

const step = {
  fontSize: '14px',
  color: '#4a4a4a',
  margin: '0 0 4px',
  lineHeight: '22px',
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
