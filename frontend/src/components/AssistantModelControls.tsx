import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AssistantConfiguration, NvidiaModel } from './AssistantSettings'
import { AssistantModelPicker } from './AssistantModelPicker'

const labels: Record<string, string> = { none: 'Rápido · sem raciocínio', standard: 'Raciocínio ativado', default: 'Padrão do modelo', low: 'Baixo', medium: 'Médio', high: 'Alto' }

export function AssistantModelControls({ configuration, pending, onChanged, children }: {
  configuration: AssistantConfiguration | null; pending: boolean; onChanged: (value: AssistantConfiguration) => void; children?: ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [catalog, setCatalog] = useState<NvidiaModel[]>([])
  const [loading, setLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const request = useRef<AbortController | null>(null)
  const model = configuration?.model || 'nvidia/nemotron-3.5-super-vl-120b-a12b'
  const current = catalog.find(item => item.id === model) || configuration?.models?.find(item => item.id === model) || { id: model, label: model.split('/').pop() || model, efforts: [configuration?.effort || 'default'] }
  const efforts = current.efforts
  const effort = configuration?.effort || efforts[0]
  const disabled = pending || saving || !configuration || configuration.locked

  async function loadCatalog(refresh = false) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setCatalogError('')
    try {
      const response = await fetch('/api/chat/models' + (refresh ? '?refresh=1' : ''), { signal: controller.signal })
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (!Array.isArray(data.models)) throw new Error()
      setCatalog(data.models); setCatalogError(data.error || '')
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setCatalogError('Não foi possível carregar o catálogo NVIDIA. Tente atualizar a lista.')
    } finally { if (request.current === controller) setLoading(false) }
  }

  useEffect(() => {
    if (configuration) void loadCatalog()
    return () => request.current?.abort()
  }, [configuration?.keyConfigured])

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
    <AssistantModelPicker current={current} models={catalog} loading={loading} error={catalogError} disabled={disabled}
      onRefresh={() => void loadCatalog(true)} onSelect={item => void change(item.id, item.efforts[0] || 'default')} />
    <label><span>Esforço</span><select aria-label="Esforço do modelo" value={effort} disabled={disabled || efforts.length < 2}
      title="Raciocínio ativado pode aumentar o tempo de resposta. Disponibilidade depende do modelo."
      onChange={event => void change(model, event.target.value)}>
      {efforts.map(value => <option key={value} value={value}>{labels[value] || value}</option>)}
    </select></label>
    {children}
    {error && <p className="assistant-model-error" role="alert">{error}</p>}
  </div>
}
