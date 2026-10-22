import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Settings2, X } from 'lucide-react'

const defaultModel = 'nvidia/nemotron-3.5-super-vl-120b-a12b'
interface Settings {
  model: string
  keyConfigured: boolean
  locked: boolean
  mode: 'local-search' | 'local-nim' | 'nvidia-api'
  externalContext: boolean
}

export function AssistantSettings({ onSaved }: { onSaved: (settings: Settings) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [model, setModel] = useState(defaultModel)
  const [custom, setCustom] = useState(false)
  const [key, setKey] = useState('')
  const [remove, setRemove] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  async function open() {
    setKey(''); setRemove(false); setError(''); setMessage(''); setSettings(null)
    dialog.current?.showModal()
    controller.current?.abort()
    controller.current = new AbortController()
    try {
      const response = await fetch('/api/chat/settings', { signal: controller.current.signal })
      if (!response.ok) throw new Error()
      const data: Settings = await response.json()
      setSettings(data); setModel(data.model); setCustom(data.model !== defaultModel)
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError('Não foi possível carregar. Confira se o serviço local está iniciado.')
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/chat/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model.trim(), apiKey: key.trim(), removeKey: remove }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.')
      setSettings(data); setKey(''); setRemove(false); onSaved(data)
      setMessage(data.keyConfigured ? 'Configuração salva. Será usada na próxima pergunta. A validade da chave ainda não foi testada.' : 'Configuração salva. Assistente em busca local.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.') }
    finally { setBusy(false) }
  }

  return <>
    <button className="assistant-settings-trigger" onClick={() => void open()}><Settings2 size={17} aria-hidden="true" />Configurações da IA</button>
    <dialog ref={dialog} className="assistant-settings" aria-labelledby="ai-settings-title" onClose={() => { setKey(''); controller.current?.abort() }} onCancel={(event) => { if (busy) event.preventDefault() }}>
      <div className="assistant-settings-heading"><h2 id="ai-settings-title">Configurações da IA</h2><button aria-label="Fechar configurações" disabled={busy} onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button></div>
      {error && <p role="alert" className="assistant-notice">{error}</p>}
      {!settings && !error && <p>Carregando configuração…</p>}
      {settings && <form onSubmit={(event) => void save(event)}>
        <p>Provedor: NVIDIA API</p>
        {settings.locked && <p className="assistant-notice">Configuração gerenciada pelas variáveis do servidor. Altere-as e reinicie o serviço.</p>}
        <fieldset disabled={busy || settings.locked}>
          <label>Modelo<select aria-label="Modelo" value={custom ? 'custom' : defaultModel} onChange={(event) => { const other = event.target.value === 'custom'; setCustom(other); setModel(other ? '' : defaultModel) }}>
            <option value={defaultModel}>Nemotron 3.5 Super (padrão)</option><option value="custom">Outro modelo NVIDIA</option>
          </select></label>
          {custom && <label>Identificador do modelo<input required maxLength={200} value={model} onChange={(event) => setModel(event.target.value)} placeholder="organização/nome-do-modelo" autoComplete="off" /></label>}
          <label>Chave de API NVIDIA<input type="password" maxLength={512} value={key} disabled={remove} onChange={(event) => setKey(event.target.value)} autoComplete="new-password" spellCheck={false} placeholder={settings.keyConfigured ? 'Chave salva · deixe vazio para manter' : 'Cole sua chave de API'} /></label>
          <small>{settings.keyConfigured ? 'Chave configurada. O valor salvo não é exibido.' : 'Sem chave, o assistente usa a busca local.'} Armazenamento no servidor em .env.local, fora do Git.</small>
          {settings.keyConfigured && <label className="assistant-settings-remove"><input type="checkbox" checked={remove} onChange={(event) => { setRemove(event.target.checked); setKey('') }} />Remover chave e usar busca local</label>}
          <p className="assistant-footnote">Com a API ativa, perguntas e trechos relevantes da documentação são enviados à NVIDIA.</p>
          <button type="submit" className="assistant-settings-save">{busy ? 'Salvando…' : 'Salvar configuração'}</button>
        </fieldset>
      </form>}
      {message && <p role="status">{message}</p>}
    </dialog>
  </>
}
