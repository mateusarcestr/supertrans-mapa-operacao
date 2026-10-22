import { useRef, useState } from 'react'
import { Check, ChevronDown, ExternalLink, LoaderCircle, RefreshCw, Search, X } from 'lucide-react'
import type { NvidiaModel } from './AssistantSettings'

export function AssistantModelPicker({ current, models, loading, error, disabled, onRefresh, onSelect }: {
  current: NvidiaModel; models: NvidiaModel[]; loading: boolean; error: string; disabled: boolean
  onRefresh: () => void; onSelect: (model: NvidiaModel) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalize(query).split(/\s+/).filter(Boolean)
  const filtered = models.filter(model => words.every(word => normalize(`${model.id} ${model.label} ${model.provider || ''} ${model.summary || ''} ${model.category || ''}`).includes(word)))
  const choose = (model: NvidiaModel) => { dialog.current?.close(); onSelect(model) }
  const show = () => { setQuery(''); setOpen(true); dialog.current?.showModal() }

  return <div className="assistant-model-field">
    <span id="model-field-label">Modelo</span>
    <button type="button" className="assistant-model-trigger" role="combobox" aria-label="Modelo do chat" aria-haspopup="dialog"
      aria-expanded={open} aria-controls="nvidia-model-picker" disabled={disabled} title={current.id}
      onClick={show} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); show() } }}>
      <span>{current.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    <dialog ref={dialog} id="nvidia-model-picker" className="assistant-model-picker" aria-labelledby="model-picker-title" onClose={() => setOpen(false)}>
      <header><div><h2 id="model-picker-title">Escolher modelo</h2><p>Catálogo oficial NVIDIA · {models.length} modelos</p></div>
        <button type="button" aria-label="Fechar lista de modelos" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button></header>
      <div className="assistant-model-search"><Search size={17} aria-hidden="true" />
        <input autoFocus aria-label="Buscar modelos NVIDIA" placeholder="Buscar por nome, fabricante ou uso…" value={query} onChange={event => setQuery(event.target.value)} />
        <button type="button" disabled={loading} aria-label="Atualizar catálogo NVIDIA" onClick={onRefresh}><RefreshCw size={16} aria-hidden="true" /></button>
      </div>
      {error && <p role="alert" className="assistant-catalog-notice">{error}</p>}
      {loading && <p role="status" className="assistant-catalog-notice"><LoaderCircle size={15} aria-hidden="true" />Consultando catálogo NVIDIA…</p>}
      <div className="assistant-model-list" role="listbox" aria-label="Modelos NVIDIA">
        {filtered.map(model => <div className="assistant-model-row" key={model.id}>
          <button type="button" role="option" aria-selected={model.id === current.id} disabled={model.selectable === false} title={model.id} onClick={() => choose(model)}>
            <div className="assistant-model-title"><strong>{model.label}</strong>{model.id === current.id && <Check size={17} aria-hidden="true" />}</div>
            <small>{model.provider} · {model.category || 'Conversa'}{model.selectable === false ? ' · Uso especializado, fora do chat' : ''}</small>
            <p>{model.summary || 'Descrição de uso ainda não disponível para este modelo.'}</p>
          </button>
          {model.sourceUrl && <a href={model.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Ficha oficial de ${model.label}`} title="Ficha oficial"><ExternalLink size={15} aria-hidden="true" /></a>}
        </div>)}
        {!loading && !filtered.length && <p className="assistant-catalog-notice">{models.length ? 'Nenhum modelo corresponde à busca.' : 'Catálogo indisponível. Confira a chave em Configurações da IA e tente atualizar.'}</p>}
      </div>
      <footer>Resumos de uso em português; disponibilidade de execução depende do modelo e da conta.</footer>
    </dialog>
  </div>
}
