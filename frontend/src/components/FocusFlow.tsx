import { ChevronLeft, ChevronRight, Circle, FileText, Flag, GitBranch, ListChecks, Repeat2, Split, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { buildFocusFlow } from '../data/focus-flow'
import { actorName, conflictsForNode, flowLabel, laneForNode, namedItems, nodePopSteps, nodeTypeLabel, readinessForNode } from '../data/model'
import type { FrontendCatalog, ProcessDiagram, ProcessFlow, ProcessNode, ProcessPayload } from '../data/types'
import { ConfidenceBadge } from './ConfidenceBadge'
import { documentedPassages } from '../data/operation'

export function FocusFlow({ process, diagram, catalog, nodeId, canGoBack, onBack, onSelect, onDetails, onPassage }: {
  process: ProcessPayload; diagram: ProcessDiagram; catalog: FrontendCatalog; nodeId: string | null
  canGoBack: boolean; onBack: () => void
  onSelect: (nodeId: string) => void; onDetails: () => void
  onPassage: (handoffId: string) => void
}) {
  const focus = buildFocusFlow(diagram, nodeId)
  const currentRef = useRef<HTMLDivElement>(null)
  const previousNode = useRef(nodeId)
  useEffect(() => {
    if (previousNode.current !== nodeId && currentRef.current && !document.querySelector('dialog[open]')) {
      currentRef.current.focus({ preventScroll: true })
      currentRef.current.scrollIntoView({ block: 'nearest' })
    }
    previousNode.current = nodeId
  }, [nodeId])
  if (!focus.node) return <p className="team-map-empty">Selecione uma atividade, evento ou decisão deste diagrama.</p>
  const node = focus.node
  const title = (item: ProcessNode) => item.name.trim() || nodeTypeLabel(item)
  const participant = (item: ProcessNode) => actorName(catalog, laneForNode(diagram, item)?.actorId)
  const edgeLabel = (flow: ProcessFlow, index: number, total: number) => flowLabel(flow) ?? (total > 1 ? `Caminho ${index + 1}` : 'Sem condição de gateway')

  const popSteps = nodePopSteps(process, node.id)
  const laneActor = participant(node)
  const popActor = popSteps.find((step) => step.executorText)?.executorText
  const divergent = Boolean(laneActor && popActor && laneActor.toLocaleLowerCase('pt-BR') !== popActor.toLocaleLowerCase('pt-BR'))
  const instruction = popSteps.find((step) => step.description)?.description
  const systems = namedItems(catalog, [...new Set(popSteps.flatMap((step) => step.systemIds))], 'systems')
  const channels = namedItems(catalog, [...new Set(popSteps.flatMap((step) => step.channelIds))], 'channels')
  const unresolved = node.subflowResolutionStatus === 'unresolved'
  const Icon = node.type === 'gateway' ? GitBranch : node.type.endsWith('Event') ? Circle : ListChecks
  const reachable = focus.outgoing.filter((item) => item.node)
  const incoming = focus.incoming.map(({ flow, node: source }, index) => <div className="operation-flow-link" key={flow.id} data-flow-id={flow.id}>
    <button className="focus-flow-node focus-flow-prev" disabled={!source} onClick={() => source && onSelect(source.id)}>
      <span className="focus-flow-edge-label">{edgeLabel(flow, index, focus.incoming.length)}</span>
      <strong>{source ? title(source) : 'Origem não determinada neste diagrama'}</strong>
      <span className="operation-node-participant">{source ? participant(source) ?? 'Não documentado' : 'Referência preservada'}</span>
    </button>
  </div>)

  return <section className="focus-flow-network" aria-label="Fluxo da atividade em foco">
    <div className="focus-flow-incoming">
      <h3>Etapas anteriores <span className="focus-flow-count">{focus.incoming.length}</span></h3>
      {focus.incoming.length > 0
        ? <><div className="focus-flow-prev-list">{incoming}</div><details className="focus-flow-prev-mobile"><summary>Etapas anteriores · {focus.incoming.length}</summary>{incoming}</details></>
        : <p className="team-map-empty">{node.type === 'startEvent' ? 'Primeira etapa do processo. Não há etapas anteriores neste diagrama.' : 'Nenhuma etapa anterior ligada neste diagrama.'}</p>}
    </div>

    <div className="focus-flow-current-wrap">
      <h3>Etapa atual</h3>
      <div ref={currentRef} tabIndex={-1} className="focus-flow-current" data-node-id={node.id}>
        <div className="focus-flow-current-head">
          <span className="focus-flow-icon" aria-hidden="true"><Icon size={19} /></span>
          <div><span className="eyebrow">{nodeTypeLabel(node)} em foco</span><h2>{title(node)}</h2></div>
          <ConfidenceBadge state={readinessForNode(process, node, conflictsForNode(catalog, node.id))} />
        </div>
        {(laneActor || popActor) && <div className="focus-flow-participants">
          <div><span>Participante (Bizagi · lane)</span><strong>{laneActor ? `${laneActor} · inferido` : 'Não documentado'}</strong></div>
          <div><span>Executor (POP)</span><strong>{popActor ?? 'Não documentado'}</strong></div>
          {divergent && <p>Os dois valores divergem. Participante ainda aguarda confirmação.</p>}
        </div>}
        {instruction && <div className="focus-flow-instruction"><span>Instrução POP</span><p>{instruction}</p></div>}
        {(systems.length > 0 || channels.length > 0) && <div className="focus-flow-chips">
          {systems.map((item) => <span key={item.id}>Sistema · {item.name}</span>)}
          {channels.map((item) => <span key={item.id}>Canal · {item.name}</span>)}
        </div>}
        {unresolved && <div className="focus-flow-warning"><TriangleAlert size={16} aria-hidden="true" /><div><strong>Referência sem destino resolvido</strong><p>O alvo original foi preservado nas fontes, mas não existe ligação confirmada neste diagrama.</p></div></div>}
        <div className="focus-flow-nav">
          <button className="secondary-button" disabled={!canGoBack} onClick={onBack}><ChevronLeft size={16} aria-hidden="true" />Voltar</button>
          <button className="ghost-button" onClick={onDetails}><FileText size={16} aria-hidden="true" />Ver evidências</button>
          <span className="focus-flow-nav-end">
            {reachable.length === 1 && focus.outgoing.length === 1
              ? <button className="primary-button" onClick={() => onSelect(reachable[0].node!.id)}>Avançar<ChevronRight size={16} aria-hidden="true" /></button>
              : focus.outgoing.length > 1
                ? <span className="focus-flow-choose"><Split size={16} aria-hidden="true" />Escolher caminho</span>
                : <button className="secondary-button" disabled><Flag size={16} aria-hidden="true" />{unresolved || focus.outgoing.length ? 'Sem destino disponível' : 'Fim deste caminho'}</button>}
          </span>
        </div>
      </div>
    </div>

    <div className="focus-flow-outgoing">
      <h3>Próximas etapas <span className="focus-flow-count">{focus.outgoing.length}</span>{focus.outgoing.length > 1 && <span className="focus-flow-paths">{focus.outgoing.length} caminhos documentados</span>}</h3>
      {focus.outgoing.length > 0 && <div className={`focus-flow-next-grid${focus.outgoing.length > 1 ? ' is-multi' : ''}`}>{focus.outgoing.map(({ flow, node: target }, index) => <div className="operation-flow-link focus-flow-next" key={flow.id} data-flow-id={flow.id}>
        <button className="focus-flow-node" disabled={!target} onClick={() => target && onSelect(target.id)}>
          <span className="focus-flow-edge-label">{edgeLabel(flow, index, focus.outgoing.length)}<ChevronRight size={16} aria-hidden="true" /></span>
          <strong>{target ? title(target) : 'Destino não determinado neste diagrama'}</strong>
          <span className="operation-node-participant">{target ? participant(target) ?? 'Não documentado' : 'Referência preservada'}</span>
        </button>
        {documentedPassages(catalog, process.id, flow.id).map((handoff) => <button key={handoff.id} className="operation-transfer" data-handoff-id={handoff.id} onClick={() => onPassage(handoff.id)}><Repeat2 size={13} aria-hidden="true" />Ver passagem entre equipes · {actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'} → {actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}</button>)}
      </div>)}</div>}
      {focus.outgoing.length === 0 && <div className="focus-flow-end"><Flag size={16} aria-hidden="true" /><span>{unresolved ? 'Sem próximas etapas disponíveis — a ligação original não possui destino confirmado neste diagrama.' : 'Fim deste caminho — não há próximas etapas documentadas a partir daqui.'}</span></div>}
    </div>
  </section>
}
