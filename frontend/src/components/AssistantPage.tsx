import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, ArrowUp, BookOpen, CornerDownLeft, LoaderCircle, MessageCircle, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FrontendCatalog } from '../data/types'
import { AssistantSettings } from './AssistantSettings'
import { ThemeToggle } from './ThemeToggle'

interface Evidence { id: string; file: string; line: number; title: string; quote: string; processId: string | null }
interface Responsibility { executor: string; activities: { title: string; diagram: string; sourceId: string }[] }
interface Reply { mode: 'local-search' | 'local-nim' | 'nvidia-api'; answer: string; sources: Evidence[]; warning?: string; responsibilities?: Responsibility[] }
interface Turn { question: string; reply?: Reply; error?: string }

export function AssistantPage({ catalog }: { catalog: FrontendCatalog }) {
  const [processId, setProcessId] = useState('P001')
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [pending, setPending] = useState(false)
  const [mode, setMode] = useState<'local-search' | 'local-nim' | 'nvidia-api' | 'offline'>('offline')
  const [externalContext, setExternalContext] = useState(false)
  const lastReply = useRef<HTMLElement>(null)
  const conversation = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)
  const revision = useRef(0)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/chat/status', { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error()
      return response.json()
    }).then((data) => { setMode(data.mode); setExternalContext(Boolean(data.externalContext)) }).catch(() => {})
    return () => { controller.abort(); request.current?.abort() }
  }, [])
  useEffect(() => {
    const viewport = conversation.current
    const turn = lastReply.current
    if (viewport && turn) {
      const top = viewport.scrollTop + turn.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24
      viewport.scrollTo({ top, behavior: 'instant' })
    }
  }, [turns])

  async function ask(value: string) {
    const text = value.trim()
    if (pending || text.length < 3) return
    const current = revision.current
    setQuestion('')
    setPending(true)
    setTurns((previous) => [...previous, { question: text }])
    request.current = new AbortController()
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, processId: processId || null }), signal: request.current.signal })
      if (!response.ok) throw new Error('Não foi possível consultar. Confira se o serviço local está iniciado e tente novamente.')
      const reply: Reply = await response.json()
      if (current !== revision.current) return
      setTurns((previous) => previous.map((turn, index) => index === previous.length - 1 ? { ...turn, reply } : turn))
    } catch (reason) {
      if (current !== revision.current) return
      setTurns((previous) => previous.map((turn, index) => index === previous.length - 1 ? { ...turn,
        error: reason instanceof Error ? reason.message : 'Consulta indisponível.' } : turn))
    } finally { if (current === revision.current) setPending(false) }
  }

  const submit = (event: FormEvent) => { event.preventDefault(); void ask(question) }
  const suggestions = ['Quem executa as etapas deste processo?', 'Como funciona a retirada do contêiner vazio?', 'O que acontece depois do aceite?']
  return (
    <div className="assistant-page">
      <header className="assistant-header">
        <div className="assistant-header-context">
        <label className="assistant-scope"><span className="sr-only">Consultar processo</span>
        <select value={processId} onChange={(event) => {
          revision.current += 1; request.current?.abort(); setPending(false); setProcessId(event.target.value); setTurns([])
          conversation.current?.scrollTo({ top: 0 })
        }}>
          <option value="">Todos os processos</option>
          {catalog.processes.map((process) => <option key={process.id} value={process.id}>{process.name}</option>)}
        </select>
      </label>
        <span className="assistant-local-status">{mode === 'nvidia-api' ? 'NVIDIA NIM · respostas com fontes' : mode === 'local-nim' ? 'NIM local · respostas com fontes' : mode === 'local-search' ? 'Busca local · trechos documentados' : 'Base de processos'}</span>
        </div>
        <div className="assistant-header-actions">
          <Link className="assistant-flow-link" to={`/operacao/${processId || 'P001'}`}><Workflow size={17} aria-hidden="true" />Ver etapas<ArrowRight size={15} aria-hidden="true" /></Link>
          <AssistantSettings onSaved={(settings) => { setMode(settings.mode); setExternalContext(settings.externalContext) }} />
          <ThemeToggle />
        </div>
      </header>
      <div className="assistant-conversation" ref={conversation} role="log" aria-label="Conversa sobre o processo" aria-live="polite" aria-busy={pending} tabIndex={0}>
        <div className={`assistant-thread${turns.length === 0 ? ' is-empty' : ''}`}>
        {turns.length === 0 && <section className="assistant-welcome">
          <span className="assistant-mark"><MessageCircle size={27} aria-hidden="true" /></span>
          <h1>O que você quer entender?</h1>
          <p>Pergunte sobre a operação. As respostas consultam somente a base de documentação.</p>
          <div className="assistant-suggestions">{suggestions.map((text) => <button key={text} onClick={() => void ask(text)}>{text}<CornerDownLeft size={15} aria-hidden="true" /></button>)}</div>
        </section>}
        {turns.map((turn, index) => <article className="assistant-turn" key={index} ref={index === turns.length - 1 ? lastReply : undefined}>
          <h2 className="assistant-question">{turn.question}</h2>
          {turn.reply && <div className="assistant-answer">
            <p className="assistant-reply-mode">{turn.reply.mode === 'nvidia-api' ? 'Resposta com NVIDIA' : turn.reply.mode === 'local-nim' ? 'Resposta com NIM local' : 'Consulta direta à documentação'}</p>
            <p className="assistant-response-text">{turn.reply.answer}</p>
            {turn.reply.warning && <p className="assistant-notice">{turn.reply.warning}</p>}
            {turn.reply.responsibilities?.map((role) => <section className="assistant-role" key={role.executor}>
              <h3>{role.executor}<span>{role.activities.length} atividades</span></h3>
              <ul>{role.activities.slice(0, 3).map((activity) => <li key={activity.sourceId}>{activity.title}{activity.diagram && <small> · {activity.diagram}</small>}</li>)}</ul>
              {role.activities.length > 3 && <details><summary>Ver mais {role.activities.length - 3} atividades</summary><ul>{role.activities.slice(3).map((activity) => <li key={activity.sourceId}>{activity.title}{activity.diagram && <small> · {activity.diagram}</small>}</li>)}</ul></details>}
            </section>)}
            {turn.reply.sources.length > 0 && <details className="assistant-sources"><summary><BookOpen size={15} aria-hidden="true" />Consultar fontes ({turn.reply.sources.length})</summary>
            {turn.reply.sources.map((source, sourceIndex) => <section className="assistant-evidence" key={source.id}>
              <h3>{source.title}</h3><blockquote>{source.quote}</blockquote>
              <details><summary><BookOpen size={14} aria-hidden="true" />Fonte {sourceIndex + 1}</summary>
                <p>{source.file} · linha {source.line}</p>
                <a href={`/knowledge/${source.file.split('/').map(encodeURIComponent).join('/')}#L${source.line}`} target="_blank" rel="noreferrer">Abrir documento local</a>
              </details>
            </section>)}</details>}
          </div>}
          {turn.error && <div role="alert" className="assistant-notice"><p>{turn.error}</p><button onClick={() => void ask(turn.question)}>Tentar novamente</button></div>}
          {!turn.reply && !turn.error && pending && <p className="assistant-loading"><LoaderCircle size={17} aria-hidden="true" />Consultando a base local…</p>}
        </article>)}
        </div>
      </div>
      <footer className="assistant-compose-area"><div className="assistant-compose-inner">
      <form className="assistant-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="process-question">Sua pergunta sobre o processo</label>
        <textarea id="process-question" rows={2} maxLength={2000} value={question} onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void ask(question) } }}
          placeholder="Ex.: quem agenda a retirada do contêiner?" />
        <button type="submit" disabled={pending || question.trim().length < 3} aria-label="Enviar pergunta"><ArrowUp size={20} aria-hidden="true" /></button>
      </form>
      <p className="assistant-footnote">Sem evidência suficiente, o assistente informa que não encontrou a resposta. {externalContext ? 'Trechos relevantes são enviados à API NVIDIA para selecionar as evidências.' : 'Busca executada neste ambiente.'}</p>
      </div></footer>
    </div>
  )
}
