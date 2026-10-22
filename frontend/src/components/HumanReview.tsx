import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { HumanDecision, HumanReview } from '../data/types'

const warnings: Record<string, string> = {
  'self-reference': 'Destino informado é o próprio processo. Confirmar diagrama e trecho chamado antes de criar ligação.',
  'needs-interpretation': 'Observação requer esclarecimento operacional.',
  'replacement-number-missing': 'Novo número do item ainda não informado.',
  'verify-pop-item-semantics': 'Conferir texto e executor do item POP indicado antes de vincular.',
  'pop-item-not-found': 'Item POP indicado não encontrado nas fontes atuais.',
}

export function HumanDecisionDetails({ decision }: { decision: HumanDecision }) {
  return (
    <div className="panel-section human-review-decision" data-review-id={decision.id}>
      <strong>{decision.answer || 'Sem resposta'}</strong>
      {decision.proposedValue && <p>Valor proposto: {decision.proposedValue}</p>}
      {decision.proposedTargetProcessId && <p>Processo indicado: {decision.proposedTargetProcessId}</p>}
      {decision.note && <p>{decision.note}</p>}
      {decision.sourceCellEdits.map((edit) => (
        <p key={edit.cell}>Texto alterado em {edit.cell}: “{edit.original}” → “{edit.received}”.</p>
      ))}
      {decision.warnings.filter((warning) => warning !== 'missing-attribution').map((warning) => (
        <p className="field-note" key={warning}>{warnings[warning] ?? warning}</p>
      ))}
      <p className="field-note">Responsável: {decision.reviewer ?? 'Não informado'} · Data da validação: {decision.reviewedAt ?? 'Não informada'}</p>
      <p className="field-note">{decision.source.file} · {decision.source.sheet}!{decision.source.cell}</p>
    </div>
  )
}

export function HumanReviewBrowser({ review }: { review: HumanReview }) {
  const [processId, setProcessId] = useState('P001')
  const [onlyPending, setOnlyPending] = useState(false)
  const visible = review.decisions.filter((decision) => decision.processId === processId && (!onlyPending || decision.warnings.some((warning) => warning !== 'missing-attribution')))
  return (
    <section className="doc-card human-review-browser">
      <h2>Respostas da revisão operacional</h2>
      <p>{review.summary.answered} de {review.summary.total} respostas recebidas. Propostas preservadas separadamente das fontes; conflitos e participantes inferidos mantêm sua classificação.</p>
      <p>Autoria/data pendentes em {review.summary.warnings['missing-attribution'] ?? 0} respostas.</p>
      <label>Processo <select value={processId} onChange={(event) => setProcessId(event.target.value)}>
        {Array.from({ length: 10 }, (_, index) => `P${String(index + 1).padStart(3, '0')}`).map((id) => <option key={id}>{id}</option>)}
      </select></label>{' '}
      <label><input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} /> Somente pendências de conteúdo</label>
      <p>{visible.length} respostas neste filtro.</p>
      {visible.map((decision) => (
        <details key={decision.id}>
          <summary>{decision.source.sheet} · {decision.subject}</summary>
          <HumanDecisionDetails decision={decision} />
          {decision.entityIds.some((id) => id.includes(':node:')) && <Link to={`/operacao/${decision.processId}?activity=${encodeURIComponent(decision.entityIds.find((id) => id.includes(':node:'))!)}`}>Abrir etapa na operação →</Link>}
        </details>
      ))}
      {visible.length === 0 && <p>Nenhuma resposta neste filtro.</p>}
    </section>
  )
}
