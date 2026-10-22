import { useState, type ReactNode } from 'react'
import type { AssistantConfiguration } from './AssistantSettings'

const labels: Record<string, string> = { none: 'Rápido · sem raciocínio', standard: 'Raciocínio ativado', default: 'Padrão do modelo' }

export function AssistantModelControls({ configuration, pending, onChanged, children }: {
  configuration: AssistantConfiguration | null; pending: boolean; onChanged: (value: AssistantConfiguration) => void; children?: ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const model = configuration?.model || 'nvidia/nemotron-3.5-super-vl-120b-a12b'
  const models = configuration?.models || [{ id: model, label: model.split('/').pop(), efforts: [configuration?.effort || 'none'] }]
  const efforts = models.find(item => item.id === model)?.efforts || ['default']
  const effort = configuration?.effort || efforts[0]
  const disabled = pending || saving || !configuration || configuration.locked

  async function change(nextModel: string, nextEffort: string) {
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/chat/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: nextModel, effort: nextEffort }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar o modelo.')
      onChanged(data)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível alterar o modelo.') }
    finally { setSaving(false) }
  }

  return <div className="assistant-model-controls" aria-busy={saving}>
    <label><span>Modelo</span><select aria-label="Modelo do chat" value={model} disabled={disabled}
      onChange={event => void change(event.target.value, models.find(item => item.id === event.target.value)?.efforts[0] || 'default')}>
      {models.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>
    <label><span>Esforço</span><select aria-label="Esforço do modelo" value={effort} disabled={disabled || efforts.length < 2}
      title="Raciocínio ativado pode aumentar o tempo de resposta. Disponibilidade depende do modelo."
      onChange={event => void change(model, event.target.value)}>
      {efforts.map(value => <option key={value} value={value}>{labels[value] || value}</option>)}
    </select></label>
    {children}
    {error && <p className="assistant-model-error" role="alert">{error}</p>}
  </div>
}
