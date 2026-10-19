import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Boxes,
  HelpCircle,
  Lightbulb,
  MessageSquareQuote,
  Search,
  Sparkles,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { answerOperationalQuestion, SUGGESTED_QUESTIONS, type OperationalAnswer, type OperationalAnswerItem } from '../data/qa-engine'
import type { FrontendCatalog } from '../data/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { Button, Input } from './orion/ui'

interface OperationalQAAssistantProps {
  catalog: FrontendCatalog
  isOpen: boolean
  onClose: () => void
  initialQuestion?: string
}

export function OperationalQAAssistant({ catalog, isOpen, onClose, initialQuestion = '' }: OperationalQAAssistantProps) {
  const [question, setQuestion] = useState(initialQuestion)
  const [activeQuery, setActiveQuery] = useState(initialQuestion)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const titleId = useId()

  const answer: OperationalAnswer = useMemo(() => {
    return answerOperationalQuestion(catalog, activeQuery)
  }, [catalog, activeQuery])

  useEffect(() => {
    if (isOpen) {
      if (initialQuestion && initialQuestion !== activeQuery) {
        setQuestion(initialQuestion)
        setActiveQuery(initialQuestion)
      }
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, initialQuestion])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAsk = (queryToAsk: string) => {
    const trimmed = queryToAsk.trim()
    setQuestion(trimmed)
    setActiveQuery(trimmed)
  }

  const handleActionClick = (item: OperationalAnswerItem) => {
    if (!item.action) return
    onClose()
    navigate(item.action.target)
  }

  return (
    <div className="modal-backdrop qa-assistant-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={dialogRef}
        className="modal qa-assistant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qa-header">
          <div className="qa-title-group">
            <span className="qa-icon-badge" aria-hidden="true">
              <MessageSquareQuote size={20} />
            </span>
            <div>
              <span className="eyebrow">Dúvidas & Respostas Operacionais</span>
              <h2 id={titleId}>Assistente de Procedimentos e Processos</h2>
            </div>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar assistente de dúvidas" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="qa-search-bar">
          <div className="qa-input-wrapper">
            <Search size={18} className="qa-search-icon" aria-hidden="true" />
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk(question)
              }}
              placeholder="Digite sua dúvida (ex: Quem faz o transbordo? Qual sistema no P001? O que acontece se a capacidade for negativa?)"
              className="qa-input"
              aria-label="Pergunta operacional"
            />
            {question && (
              <button
                type="button"
                className="qa-clear-button"
                onClick={() => {
                  setQuestion('')
                  setActiveQuery('')
                  inputRef.current?.focus()
                }}
                aria-label="Limpar dúvida"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <Button type="button" className="primary-button qa-submit-btn" onClick={() => handleAsk(question)}>
            Consultar
          </Button>
        </div>

        <div className="qa-body">
          {activeQuery ? (
            <div className="qa-answer-container">
              <div className="qa-headline-bar">
                <div>
                  <h3 className="qa-headline">{answer.headline}</h3>
                  <div className="qa-metadata-row">
                    <ConfidenceBadge state={answer.confidence} />
                    {answer.sourcesCount > 0 && (
                      <span className="qa-sources-tag">{answer.sourcesCount} fonte(s) oficial(is) Bizagi/POP</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="qa-direct-answer-card">
                <p className="qa-direct-text">{answer.directAnswer}</p>
                {answer.confidenceNote && (
                  <div className="qa-confidence-note">
                    <Sparkles size={15} className="qa-note-icon" aria-hidden="true" />
                    <span>{answer.confidenceNote}</span>
                  </div>
                )}
              </div>

              {answer.items.length > 0 && (
                <div className="qa-items-section">
                  <h4>Elementos identificados no modelo ({answer.items.length})</h4>
                  <div className="qa-items-grid">
                    {answer.items.map((item) => (
                      <div key={item.id} className="qa-item-card">
                        <div className="qa-item-header">
                          <span className={`qa-item-kind-tag kind-${item.kind}`}>
                            {item.kind === 'activity' && <Workflow size={13} />}
                            {item.kind === 'actor' && <UsersRound size={13} />}
                            {item.kind === 'system' && <Boxes size={13} />}
                            {item.kind === 'handoff' && <ArrowRight size={13} />}
                            {item.kind === 'process' && <BookOpen size={13} />}
                            <span>{item.kind}</span>
                          </span>
                          {item.confidence && <ConfidenceBadge state={item.confidence} compact />}
                        </div>
                        <strong className="qa-item-title">{item.title}</strong>
                        {item.subtitle && <p className="qa-item-subtitle">{item.subtitle}</p>}
                        {item.description && <p className="qa-item-desc">{item.description}</p>}
                        {item.action && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="qa-item-action-btn"
                            onClick={() => handleActionClick(item)}
                          >
                            <span>{item.action.label}</span>
                            <ArrowRight size={14} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {answer.suggestedFollowUps.length > 0 && (
                <div className="qa-followups-section">
                  <div className="qa-followup-title">
                    <Lightbulb size={16} />
                    <span>Dúvidas relacionadas:</span>
                  </div>
                  <div className="qa-followup-chips">
                    {answer.suggestedFollowUps.map((suggested) => (
                      <button key={suggested} type="button" className="qa-chip-button" onClick={() => handleAsk(suggested)}>
                        {suggested}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="qa-suggestions-view">
              <div className="qa-suggestions-intro">
                <HelpCircle size={28} className="qa-intro-icon" />
                <h3>Pergunte sobre qualquer etapa, regra ou responsabilidade</h3>
                <p>
                  O assistente consulta diretamente os 10 processos modelados em Bizagi e os 10 POPs descritivos. Clique em uma das dúvidas
                  comuns abaixo para testar:
                </p>
              </div>

              <div className="qa-categories-grid">
                {SUGGESTED_QUESTIONS.map((cat) => (
                  <div key={cat.category} className="qa-category-card">
                    <h4>{cat.category}</h4>
                    <ul className="qa-suggestion-list">
                      {cat.questions.map((q) => (
                        <li key={q}>
                          <button type="button" className="qa-suggestion-item-btn" onClick={() => handleAsk(q)}>
                            <span>{q}</span>
                            <ArrowRight size={14} className="qa-arrow-icon" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
