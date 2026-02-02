'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

interface ColorScheme {
  primary?: string
  accent?: string
}

interface CustomColors {
  light?: ColorScheme
  dark?: ColorScheme
}

interface WorkspaceThemeProviderProps {
  children: React.ReactNode
  customColors?: CustomColors | null
}

export function WorkspaceThemeProvider({
  children,
  customColors
}: WorkspaceThemeProviderProps) {
  const { theme, systemTheme } = useTheme()

  useEffect(() => {
    // Si no hay colores personalizados, no hacer nada (usar defaults de globals.css)
    if (!customColors) return

    // Determinar modo actual (light o dark)
    const currentTheme = theme === 'system' ? systemTheme : theme
    const mode = currentTheme === 'dark' ? 'dark' : 'light'
    const colors = customColors[mode]

    if (!colors || Object.keys(colors).length === 0) return

    // Inyectar CSS variables en :root
    const root = document.documentElement

    // Aplicar colores personalizados
    if (colors.primary) {
      root.style.setProperty('--primary', colors.primary)
    }
    if (colors.accent) {
      root.style.setProperty('--accent', colors.accent)
      // En modo light, accent-foreground usa el color accent
      if (mode === 'light') {
        root.style.setProperty('--accent-foreground', colors.accent)
      }
    }

    console.log(`[WorkspaceThemeProvider] Colores aplicados (${mode}):`, colors)

    // Cleanup: restaurar valores por defecto al desmontar
    return () => {
      if (colors.primary) {
        root.style.removeProperty('--primary')
      }
      if (colors.accent) {
        root.style.removeProperty('--accent')
        if (mode === 'light') {
          root.style.removeProperty('--accent-foreground')
        }
      }
    }
  }, [customColors, theme, systemTheme])

  return <>{children}</>
}
