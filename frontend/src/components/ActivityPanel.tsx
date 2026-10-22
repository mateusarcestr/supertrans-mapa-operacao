import { useMemo, type ReactNode } from 'react'
import { UsersRound, ClipboardList, ArrowLeftRight, Package, FileText, Route, ClipboardCheck, X } from 'lucide-react'

import {
  actorName,
  conflictsForNode,
  flowLabel,
  laneForNode,
  namedItems,
  nodeDisplayName,
  nodePopSteps,
  nodeReconciliations,
  nodeTypeLabel,
  readinessForNode,
  sourceConflictsForNode,
} from '../data/model'
import type { FrontendCatalog, Handoff, ProcessDiagram, ProcessNode, ProcessPayload, ReviewConflict, SourceReference } from '../data/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EvidenceList } from './EvidenceList'
import { HumanDecisionDetails } from './HumanReview'

interface ActivityPanelProps {
  process: ProcessPayload
  diagram: ProcessDiagram
  node: ProcessNode | null
  catalog: FrontendCatalog
  onSelectNode: (nodeId: string) => void
  onClose: () => void
  showAllEvidence?: boolean
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  const Icon = ({ Responsabilidade: UsersRound, 'Informação operacional': ClipboardList, Handoffs: ArrowLeftRight,
    Artefatos: Package, Evidências: FileText, Navegação: Route, 'Caminhos documentados': Route,
    'Revisão operacional recebida': ClipboardCheck } as Record<string, typeof FileText>)[title] ?? FileText
  return (
    <section className="panel-section">
      <h4 className="with-icon"><Icon size={16} aria-hidden="true" />{title}</h4>
      {children}
    </section>
  )
}

export function ActivityPanel({ process, diagram, node, catalog, onSelectNode, onClose, showAllEvidence = false }: ActivityPanelProps) {
  const nodeById = useMemo(() => new Map(diagram.nodes.map((item) => [item.id, item])), [diagram])
  if (!node) {
    return (
      <aside className="context-panel empty-panel">
        <div className="empty-panel-icon">⌁</div>
        <span className="eyebrow">Painel contextual</span>
        <h2>Selecione um elemento</h2>
        <p>Escolha uma atividade, decisão ou evento no fluxo para consultar responsabilidade, evidências e próximos caminhos.</p>
        <div className="panel-hint">As lanes do Bizagi são geométricas e permanecem marcadas como inferidas.</div>
      </aside>
    )
  }

  const reconciliation = nodeReconciliations(process, node.id)
  const popSteps = nodePopSteps(process, node.id)
  const conflicts = conflictsForNode(catalog, node.id)
  const relatedIds = new Set([node.id, ...popSteps.map((step) => step.id)])
  const humanDecisions = catalog.humanReview?.decisions.filter((decision) => decision.processId === process.id && decision.entityIds.some((id) => relatedIds.has(id))) ?? []
  const lane = laneForNode(diagram, node)
  const laneActor = actorName(catalog, lane?.actorId)
  const popActor = popSteps.find((step) => step.executorActorId)?.executorText
  const readiness = readinessForNode(process, node, conflicts)
  const systems = namedItems(catalog, [...new Set(popSteps.flatMap((step) => step.systemIds))], 'systems')
  const channels = namedItems(catalog, [...new Set(popSteps.flatMap((step) => step.channelIds))], 'channels')
  const artifacts = namedItems(catalog, [...new Set(popSteps.flatMap((step) => step.artifactIds))], 'artifacts')
  const sourceReferences: SourceReference[] = [
    ...node.sources,
    ...reconciliation.flatMap((item) => item.sources),
    ...popSteps.flatMap((step) => step.sources),
  ]
  const handoffs = (catalog.handoffs as Handoff[]).filter(
    (handoff) => handoff.processId === process.id && (handoff.sourceNodeId === node.id || handoff.targetNodeId === node.id),
  )
  const outgoing = node.outgoing
    .map((flowId) => diagram.flows.find((flow) => flow.id === flowId))
    .filter((flow): flow is (typeof diagram.flows)[number] => Boolean(flow))
  const incoming = node.incoming
    .map((flowId) => diagram.flows.find((flow) => flow.id === flowId))
    .filter((flow): flow is (typeof diagram.flows)[number] => Boolean(flow))
  const isGateway = node.type === 'gateway'
  const unresolved =
    node.type === 'subprocess' &&
    process.subprocessReferences.some((reference) => reference.sourceNodeId === node.id && reference.resolutionStatus === 'unresolved')

  return (
    <aside className="context-panel" aria-label="Detalhes do elemento selecionado">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{isGateway ? 'Decisão / Gateway' : nodeTypeLabel(node)}</span>
          <h2>{nodeDisplayName(node)}</h2>
        </div>
        <button className="icon-button" aria-label="Fechar painel" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <ConfidenceBadge state={readiness} />

      {unresolved && (
        <div className="attention-box">
          <strong>SUBPROCESSO · Destino não resolvido</strong>
          <p>O alvo original foi preservado, mas não existe ligação local confirmada.</p>
        </div>
      )}

      <PanelSection title="Responsabilidade">
        {laneActor ? (
          <div className="value-with-badge">
            <strong>{laneActor}</strong>
            <ConfidenceBadge state="READY_WITH_INFERENCE_BADGE" compact />
          </div>
        ) : (
          <p className="muted">Não documentado</p>
        )}
        <p className="field-note">Área/lane: {lane?.name ?? 'Não determinada'} · método geometry</p>
        {popActor && <p className="field-note">{node.reviewedExecutorText ? 'Executor revisado' : 'Executor POP'}: {popActor}</p>}
      </PanelSection>

      <PanelSection title="Informação operacional">
        <dl className="detail-list">
          <div>
            <dt>Sistema</dt>
            <dd>{systems.length ? systems.map((item) => item.name).join(', ') : 'Não documentado'}</dd>
          </div>
          <div>
            <dt>Canal</dt>
            <dd>{channels.length ? channels.map((item) => item.name).join(', ') : 'Não documentado'}</dd>
          </div>
          <div>
            <dt>Entrada / saída</dt>
            <dd>{popSteps[0]?.description ?? 'Não documentado'}</dd>
          </div>
          <div>
            <dt>Próximo passo</dt>
            <dd>
              {outgoing.length
                ? outgoing
                    .map((flow) => {
                      const target = flow ? nodeById.get(flow.targetNodeId) : undefined
                      return target ? target.name : 'Destino não determinado'
                    })
                    .join(' · ')
                : 'Não documentado'}
            </dd>
          </div>
        </dl>
      </PanelSection>

      {isGateway && (
        <PanelSection title="Caminhos documentados">
          <div className="flow-list">
            <p className="field-note">
              Tipo: {node.gatewayType && node.gatewayType !== 'unknown' ? node.gatewayType : 'Tipo não determinado'}
            </p>
            <p className="field-note">
              Entradas: {incoming.length || 'Não documentado'} · Saídas: {outgoing.length || 'Não documentado'}
            </p>
            {outgoing.map((flow, index) => (
              <div className="flow-row" key={flow?.id ?? index}>
                <span>{flow ? (flowLabel(flow) ?? `Caminho ${index + 1}`) : `Caminho ${index + 1}`}</span>
                <span className="muted">{flow ? (nodeById.get(flow.targetNodeId)?.name ?? 'Destino não determinado') : ''}</span>
              </div>
            ))}
          </div>
        </PanelSection>
      )}

      <PanelSection title="Handoffs">
        {handoffs.length ? (
          handoffs.map((handoff) => (
            <div className="handoff-mini" key={handoff.id}>
              <strong>
                {actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'} →{' '}
                {actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}
              </strong>
              <span>derived-from-inferred-assignment</span>
            </div>
          ))
        ) : (
          <p className="muted">Nenhum handoff documentado para este elemento.</p>
        )}
      </PanelSection>

      <PanelSection title="Artefatos">
        {artifacts.length ? (
          <div className="tag-list">
            {artifacts.map((item) => (
              <span className="tag" key={item.id}>
                {item.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">Não documentado</p>
        )}
      </PanelSection>

      {sourceConflictsForNode(catalog, node.id).length > 0 && <ConflictBlock conflicts={sourceConflictsForNode(catalog, node.id)} />}

      {humanDecisions.length > 0 && (
        <PanelSection title="Revisão operacional recebida">
          <p className="field-note">Decisões aplicadas indicadas abaixo; fontes originais preservadas.</p>
          {humanDecisions.map((decision) => <HumanDecisionDetails key={decision.id} decision={decision} />)}
        </PanelSection>
      )}

      <PanelSection title="Evidências">
        <EvidenceList sources={sourceReferences} match={node.reconciliationStatus} showAll={showAllEvidence} />
      </PanelSection>

      <PanelSection title="Navegação">
        <div className="next-node-list">
          {outgoing.map((flow, index) => {
            const target = flow ? nodeById.get(flow.targetNodeId) : undefined
            return target ? (
              <button className="next-node" key={target.id} onClick={() => onSelectNode(target.id)}>
                <span>{flow ? (flowLabel(flow) ?? `Caminho ${index + 1}`) : `Caminho ${index + 1}`}</span>
                <strong>{target.name}</strong>
              </button>
            ) : null
          })}
        </div>
      </PanelSection>
    </aside>
  )
}

function ConflictBlock({ conflicts }: { conflicts: ReviewConflict[] }) {
  return (
    <div className={conflicts.some((conflict) => conflict.status !== 'resolved-human-review') ? 'conflict-box' : 'panel-section'}>
      <div className="conflict-title">
        <span>!</span>
        <strong>{conflicts.some((conflict) => conflict.status !== 'resolved-human-review') ? 'CONFLITO ENTRE FONTES' : 'HISTÓRICO BIZAGI × POP · RESOLVIDO'}</strong>
      </div>
      {conflicts.slice(0, 3).map((conflict) => (
        <div className="conflict-item" key={conflict.id}>
          <div>
            <span>Bizagi</span>
            <p>{textValue(conflict.bizagiValue) ?? 'Não documentado'}</p>
          </div>
          <div>
            <span>POP</span>
            <p>{textValue(conflict.popValue) ?? 'Não documentado'}</p>
          </div>
          <small>Status: {conflict.status}</small>
        </div>
      ))}
    </div>
  )
}
