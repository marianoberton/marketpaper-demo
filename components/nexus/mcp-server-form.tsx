'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import type { NexusMcpServerConfig } from '@/lib/nexus/types'

interface McpServerFormProps {
  initialData?: NexusMcpServerConfig
  onSave: (data: NexusMcpServerConfig) => void
  onCancel: () => void
}

export function McpServerForm({ initialData, onSave, onCancel }: McpServerFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [transport, setTransport] = useState<'stdio' | 'sse'>(initialData?.transport || 'stdio')
  const [command, setCommand] = useState(initialData?.command || '')
  const [args, setArgs] = useState(initialData?.args?.join(', ') || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    initialData?.env
      ? Object.entries(initialData.env).map(([key, value]) => ({ key, value }))
      : []
  )

  function addEnvVar() {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  function removeEnvVar(index: number) {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  function updateEnvVar(index: number, field: 'key' | 'value', val: string) {
    const updated = [...envVars]
    updated[index][field] = val
    setEnvVars(updated)
  }

  function handleSubmit() {
    if (!name.trim()) return

    const config: NexusMcpServerConfig = {
      name: name.trim(),
      transport,
    }

    if (transport === 'stdio') {
      config.command = command.trim()
      config.args = args
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    } else {
      config.url = url.trim()
    }

    const envObj: Record<string, string> = {}
    for (const v of envVars) {
      if (v.key.trim()) {
        envObj[v.key.trim()] = v.value
      }
    }
    if (Object.keys(envObj).length > 0) {
      config.env = envObj
    }

    onSave(config)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre *</Label>
        <Input
          placeholder="ej. my-mcp-server"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Transport</Label>
        <Select value={transport} onValueChange={(v) => setTransport(v as 'stdio' | 'sse')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stdio">stdio</SelectItem>
            <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transport === 'stdio' ? (
        <>
          <div className="space-y-2">
            <Label>Command</Label>
            <Input
              placeholder="ej. npx"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Arguments (separados por coma)</Label>
            <Input
              placeholder="ej. -y, @modelcontextprotocol/server-filesystem, /path"
              value={args}
              onChange={(e) => setArgs(e.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            placeholder="ej. http://localhost:3001/sse"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      )}

      {/* Env Vars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Variables de Entorno</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
            <Plus className="mr-1 h-3 w-3" />
            Agregar
          </Button>
        </div>
        {envVars.length > 0 && (
          <div className="space-y-2">
            {envVars.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="KEY"
                  value={v.key}
                  onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                  className="font-mono text-sm"
                />
                <Input
                  placeholder="value"
                  value={v.value}
                  onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEnvVar(i)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!name.trim()}>
          {initialData ? 'Guardar Cambios' : 'Agregar MCP'}
        </Button>
      </div>
    </div>
  )
}
