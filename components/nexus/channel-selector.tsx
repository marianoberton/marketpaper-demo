'use client'

import { MessageSquare, Send, Hash, Globe, Check } from 'lucide-react'
import { CHANNEL_OPTIONS } from '@/lib/nexus/constants'
import type { IntegrationProvider } from '@/lib/nexus/constants'

const CHANNEL_ICONS: Record<IntegrationProvider, React.ElementType> = {
  whatsapp: MessageSquare,
  telegram: Send,
  slack: Hash,
  chatwoot: Globe,
}

interface ChannelSelectorProps {
  selectedChannels: string[]
  onChange: (channels: string[]) => void
  availableChannels?: string[]
}

export function ChannelSelector({
  selectedChannels,
  onChange,
  availableChannels,
}: ChannelSelectorProps) {
  function toggle(channelId: string) {
    if (selectedChannels.includes(channelId)) {
      onChange(selectedChannels.filter((c) => c !== channelId))
    } else {
      onChange([...selectedChannels, channelId])
    }
  }

  const channels = availableChannels
    ? CHANNEL_OPTIONS.filter((c) => availableChannels.includes(c.id))
    : CHANNEL_OPTIONS

  if (channels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay canales configurados en el proyecto.
        Configurá integraciones en la pestaña Integraciones.
      </p>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {channels.map((channel) => {
        const selected = selectedChannels.includes(channel.id)
        const Icon = CHANNEL_ICONS[channel.id]

        return (
          <button
            key={channel.id}
            type="button"
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
              selected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            }`}
            onClick={() => toggle(channel.id)}
          >
            <div
              className={`p-2 rounded-lg ${
                selected ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className="font-medium flex-1">{channel.label}</span>
            {selected && <Check className="h-4 w-4 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
