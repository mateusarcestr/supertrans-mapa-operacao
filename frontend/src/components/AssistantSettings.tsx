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

  async function probe(modelId: string, apiKey: string) {
    const response = await fetch('/api/chat/settings/test', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, apiKey }), signal: AbortSignal.timeout(35000) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Não foi possível testar a conexão.')
    return data as { ok: boolean; message: string }
  }

  async function testConnection() {
    setBusy(true); setError(''); setMessage('Testando conexão com a NVIDIA, sem enviar documentos…')
    try {
      const result = await probe(model.trim(), key.trim())
      setMessage(result.ok ? result.message : '')
      if (!result.ok) setError(result.message)
    } catch (reason) { setMessage(''); setError(reason instanceof Error && reason.name === 'Error' ? reason.message : 'O teste de conexão não foi concluído. Confira se o serviço está iniciado e tente novamente.') }
    finally { setBusy(false) }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    let saved = false
    try {
      const response = await fetch('/api/chat/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model.trim(), apiKey: key.trim(), removeKey: remove }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar.')
      saved = true
      setSettings(data); setKey(''); setRemove(false); onSaved(data)
      if (data.keyConfigured) {
        setMessage('Configuração salva. Testando conexão com a NVIDIA, sem enviar documentos…')
        const result = await probe(data.model, '')
        setMessage(result.ok ? 'Configuração salva. ' + result.message : '')
        if (!result.ok) setError('Configuração salva, mas a conexão falhou. ' + result.message)
      } else setMessage('Configuração salva. Assistente em busca local.')
    } catch (reason) {
      setMessage('')
      const detail = reason instanceof Error && reason.name === 'Error' ? reason.message : 'O serviço ou o teste de conexão não respondeu. Tente novamente.'
      setError((saved ? 'Configuração salva. ' : '') + detail)
    }
    finally { setBusy(false) }
  }

  return <>
    <button className="assistant-settings-trigger" aria-label="Configurações da IA" onClick={() => void open()}><Settings2 size={17} aria-hidden="true" /><span>Configurações da IA</span></button>
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
          <button type="button" className="assistant-settings-test" disabled={remove || (!key.trim() && !settings.keyConfigured)} onClick={() => void testConnection()}>Testar conexão</button>
          <button type="submit" className="assistant-settings-save">{busy ? 'Aguarde…' : 'Salvar configuração'}</button>
        </fieldset>
      </form>}
      {message && <p role="status">{message}</p>}
    </dialog>
  </>
}
