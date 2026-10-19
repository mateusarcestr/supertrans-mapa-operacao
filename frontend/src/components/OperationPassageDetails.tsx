import { ArrowRight } from 'lucide-react'
import { actorName } from '../data/model'
import { handoffConfidence, splitHandoffActivityNames } from '../data/presentation'
import type { FrontendCatalog, Handoff } from '../data/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EvidenceList } from './EvidenceList'

export function OperationPassageDetails({
  catalog,
  handoff,
  onSelectNode,
  onClose,
}: {
  catalog: FrontendCatalog
  handoff: Handoff
  onSelectNode: (id: string) => void
  onClose: () => void
}) {
  const labels = splitHandoffActivityNames(handoff.name)
  return (
    <section className="operation-passage-details">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">Passagem entre participantes</span>
          <h2>
            {actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'} <ArrowRight size={20} aria-hidden="true" />{' '}
            {actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}
          </h2>
        </div>
        <button className="icon-button" aria-label="Fechar painel" onClick={onClose}>
          ×
        </button>
      </header>
      <ConfidenceBadge state={handoffConfidence(handoff)} />
      <div className="handoff-card-activities">
        <div>
          <span className="handoff-field-label">Sai da atividade</span>
          <button className="text-button" onClick={() => onSelectNode(handoff.sourceNodeId)}>
            {labels.source}
          </button>
        </div>
        <div>
          <span className="handoff-field-label">Chega na atividade</span>
          <button className="text-button" onClick={() => onSelectNode(handoff.targetNodeId)}>
            {labels.destination ?? 'Não identificada'}
          </button>
        </div>
      </div>
      <p className="team-map-note">
        Entrega ligada a uma transição original Bizagi. Associação de participantes continua inferida a partir dos POP (Procedimentos
        Operacionais Padrão).
      </p>
      <h3>Evidências da passagem</h3>
      <EvidenceList sources={handoff.sources} showAll />
    </section>
  )
}
