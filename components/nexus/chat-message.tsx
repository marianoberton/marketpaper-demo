'use client'

import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn('flex gap-3', role === 'user' ? 'flex-row-reverse' : '')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          role === 'user' ? 'bg-primary' : 'bg-muted',
        )}
      >
        {role === 'user' ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-foreground" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm',
          role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
