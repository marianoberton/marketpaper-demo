'use client'

import { useState, useEffect } from 'react'
import { RotateCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RotateDeviceBannerProps {
  message?: string
  showOnPortrait?: boolean
}

/**
 * Banner que sugiere rotar el dispositivo a landscape
 * Solo se muestra en mobile portrait
 */
export function RotateDeviceBanner({
  message = 'Para una mejor experiencia, rota tu dispositivo',
  showOnPortrait = true
}: RotateDeviceBannerProps) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      // Solo mostrar en mobile (< 640px) y en portrait
      const isMobile = window.innerWidth < 640
      const isPortrait = window.innerHeight > window.innerWidth

      if (isMobile && isPortrait && showOnPortrait && !dismissed) {
        setShow(true)
      } else {
        setShow(false)
      }
    }

    // Check inicial
    checkOrientation()

    // Listener para cambios de orientación y resize
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [dismissed, showOnPortrait])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <RotateCw className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 hover:bg-primary-foreground/10"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>
    </div>
  )
}
