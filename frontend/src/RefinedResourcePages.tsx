import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, FileText, Mail, MessageCircle, Monitor, Users } from 'lucide-react'

import { ConfidenceBadge } from './components/ConfidenceBadge'
import { EvidenceList } from './components/EvidenceList'
import { PageHeader } from './components/orion/blocks'
import { Input } from './components/orion/ui'
import { operationDataClient } from './data/client'
import { actorName, laneForNode, nodePopSteps, sourceProcessIds } from './data/model'
import {
  aggregateConfidence,
  buildHandoffMatrix,
  catalogItemConfidence,
  filterHandoffs,
  handoffInferenceSummary,
  handoffConfidence,
  normalizeRelationshipView,
  splitHandoffActivityNames,
  type RelationshipView,
} from './data/presentation'
import { readinessCopy, type DataConfidenceState } from './data/readiness'
import { buildTwinModel } from './data/twin'
import { groupChannels } from './data/resources'
import { groupHandoffsForReading } from './data/handoff-reading'
import type { FrontendCatalog, Handoff, ReviewConflict, SourceReference } from './data/types'

export interface PageProps {
  catalog: FrontendCatalog
}

interface RelatedActivity {
  id: string
  processId: string
  name: string
  systemIds: string[]
}

function useRelatedActivities(catalog: FrontendCatalog, actorId?: string, resourceId?: string, memberIds?: string[]) {
  const [state, setState] = useState<{ loading: boolean; items: RelatedActivity[]; error?: string }>({ loading: false, items: [] })
  useEffect(() => {
    if (!actorId && !resourceId) {
      setState({ loading: false, items: [] })
      return
    }
    let active = true
    setState({ loading: true, items: [] })
    const twin = buildTwinModel(catalog)
    const actorProcesses = actorId ? twin.areas.find((area) => area.actorId === actorId)?.processIds ?? [] : []
    const resourceIds = memberIds ?? (resourceId ? [resourceId] : [])
    const resources = [...catalog.systems, ...catalog.channels, ...catalog.artifacts].filter((item) => resourceIds.includes(item.id))
    const processIds = actorId ? actorProcesses : sourceProcessIds(resources.flatMap((item) => item.sources))
    Promise.all(processIds.map((processId) => operationDataClient.loadProcess(processId)))
      .then((processes) => {
        if (!active) return
        const items = processes.flatMap((process) => process.diagrams.flatMap((diagram) => diagram.nodes.flatMap((node) => {
          const popSteps = nodePopSteps(process, node.id)
          const matchesActor = actorId ? laneForNode(diagram, node)?.actorId === actorId : false
          const matchesResource = resourceId ? popSteps.some((step) => [...step.systemIds, ...step.channelIds, ...step.artifactIds].some((id) => resourceIds.includes(id))) : false
          if (!matchesActor && !matchesResource) return []
          return [{
            id: node.id,
            processId: process.id,
            name: node.name.trim() || node.originalId || node.id,
            systemIds: [...new Set(popSteps.flatMap((step) => step.systemIds))],
          }]
        })))
        const unique = [...new Map(items.map((item) => [item.id, item])).values()]
          .sort((left, right) => `${left.processId}|${left.name}`.localeCompare(`${right.processId}|${right.name}`, 'pt-BR'))
        setState({ loading: false, items: unique })
      })
      .catch((reason: unknown) => {
        if (active) setState({ loading: false, items: [], error: reason instanceof Error ? reason.message : 'Falha ao carregar vínculos.' })
      })
    return () => { active = false }
  }, [actorId, catalog, resourceId, memberIds])
  return state
}

function classificationLabel(value?: string) {
  if (value === 'internal') return 'Participante interno'
  if (value === 'external') return 'Participante externo'
  return 'Tipo não determinado'
}

function EmptyMapping({ children }: { children: ReactNode }) {
  return <div className="mapped-empty"><span aria-hidden="true">—</span><p>{children}</p></div>
}

function SegmentedControl({ value, onChange, listLabel = 'Rede' }: { value: RelationshipView; onChange: (value: RelationshipView) => void; listLabel?: string }) {
  return <div className="segmented-control" aria-label="Modo de visualização">
    <button aria-pressed={value === 'network'} className={value === 'network' ? 'is-active' : ''} onClick={() => onChange('network')}>{listLabel}</button>
    <button aria-pressed={value === 'matrix'} className={value === 'matrix' ? 'is-active' : ''} onClick={() => onChange('matrix')}>Matriz</button>
  </div>
}

export function AreasPage({ catalog }: PageProps) {
  const [params, setParams] = useSearchParams()
  const twin = useMemo(() => buildTwinModel(catalog), [catalog])
  const requested = params.get('actor')
  const defaultArea = useMemo(
    () => [...twin.areas].sort((left, right) => right.handoffCount - left.handoffCount || left.name.localeCompare(right.name, 'pt-BR'))[0],
    [twin.areas],
  )
  const selected = twin.areas.find((area) => area.actorId === requested) ?? defaultArea
  const view = normalizeRelationshipView(params.get('view'))
  const [query, setQuery] = useState('')
  const [classification, setClassification] = useState('all')
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const visibleActors = twin.areas.filter((area) =>
    (classification === 'all' || area.classification === classification)
    && (!normalizedQuery || area.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery)),
  )
  const handoffs = catalog.handoffs as Handoff[]
  const selectedHandoffs = selected ? handoffs.filter((handoff) => handoff.fromActorId === selected.actorId || handoff.toActorId === selected.actorId) : []
  const related = useRelatedActivities(catalog, selected?.actorId)
  const systemIds = [...new Set(related.items.flatMap((activity) => activity.systemIds))]

  const update = (next: { actor?: string; view?: RelationshipView }) => {
    const copy = new URLSearchParams(params)
    if (next.actor) copy.set('actor', next.actor)
    if (next.view) next.view === 'matrix' ? copy.set('view', 'matrix') : copy.delete('view')
    setParams(copy, { replace: true })
  }

  return <ResourcePageLayout eyebrow="Participantes e atribuições" title="Áreas e responsabilidades" description="Consulte quais participantes aparecem em cada processo, as atividades associadas e as passagens de entrada e saída. Atribuições inferidas seguem identificadas.">
    <div className="module-toolbar">
      <label className="field-control"><span>Buscar participante</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome do participante" /></label>
      <label className="field-control"><span>Classificação</span><select value={classification} onChange={(event) => setClassification(event.target.value)}><option value="all">Todas</option><option value="internal">Interno</option><option value="external">Externo</option><option value="unknown">Não determinado</option></select></label>
      <div className="aggregation-note"><strong>{visibleActors.length}</strong><span>participantes exibidos</span><ConfidenceBadge state="READY_WITH_INFERENCE_BADGE" /></div>
      <SegmentedControl value={view} onChange={(next) => update({ view: next })} />
    </div>
    <div className="areas-workspace">
      <aside className="participant-list" aria-label="Participantes do modelo">
        {visibleActors.map((area) => <button key={area.actorId} className={area.actorId === selected?.actorId ? 'participant-row is-selected' : 'participant-row'} onClick={() => update({ actor: area.actorId })}>
          <span className={`participant-mark participant-${area.classification}`}>{area.name.slice(0, 1)}</span>
          <span><strong>{area.name}</strong><small>{classificationLabel(area.classification)} · {area.processIds.length} processos</small></span>
          <ConfidenceBadge state={area.confidence} compact />
        </button>)}
        {visibleActors.length === 0 && <EmptyMapping>Nenhum participante mapeado atende aos filtros atuais.</EmptyMapping>}
      </aside>
      <section className="relationship-canvas" aria-label={view === 'network' ? 'Rede direcional de participantes' : 'Matriz direcional de participantes'}>
        <div className="relationship-heading"><div><span className="eyebrow">{view === 'network' ? 'Rede de handoffs' : 'Matriz origem → destino'}</span><h2>Quem entrega para quem</h2></div><span className="uncertain-count">{handoffs.length} relações mapeadas <ConfidenceBadge state="READY_WITH_INFERENCE_BADGE" compact /></span></div>
        {view === 'network'
          ? <ActorNetwork catalog={catalog} selectedActorId={selected?.actorId} onSelect={(actorId) => update({ actor: actorId })} />
          : <HandoffMatrix catalog={catalog} handoffs={handoffs} selectedActorId={selected?.actorId} onSelect={(actorId) => update({ actor: actorId })} />}
      </section>
      <aside className="resource-detail participant-detail" aria-live="polite">
        {selected && <>
          <div className="panel-heading"><div><span className="eyebrow">Participante selecionado</span><h2>{selected.name}</h2></div><ConfidenceBadge state={selected.confidence} /></div>
          <p className="participant-type">{classificationLabel(selected.classification)}</p>
          <div className="detail-kpi-row"><span><strong>{selected.processIds.length}</strong> processos</span><span><strong>{selectedHandoffs.length}</strong> handoffs mapeados</span><span><strong>{related.items.length}</strong> atividades vinculadas</span></div>
          <h4>Processos relacionados</h4>
          <div className="tag-list">{selected.processIds.map((id) => <Link className="tag" key={id} to={`/processos/${id}`}>{id}</Link>)}{selected.processIds.length === 0 && <span className="muted">Nenhum processo vinculado no mapeamento atual.</span>}</div>
          <h4>Atividades relacionadas</h4>
          {related.loading ? <div className="skeleton-list" aria-label="Carregando atividades"><i /><i /><i /></div> : related.error ? <p className="inline-error">{related.error}</p> : <div className="linked-activity-list">{related.items.slice(0, 12).map((activity) => <Link key={activity.id} to={`/processos/${activity.processId}?activity=${encodeURIComponent(activity.id)}`}><span>{activity.processId}</span><strong>{activity.name}</strong></Link>)}{related.items.length === 0 && <EmptyMapping>Nenhuma atividade vinculada no mapeamento atual.</EmptyMapping>}</div>}
          <h4>Handoffs de entrada e saída</h4>
          <div className="handoff-mini-list">{selectedHandoffs.slice(0, 10).map((handoff) => <div className="handoff-mini" key={handoff.id}><strong>{actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'} → {actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}</strong><span>{handoff.processId} · derived-from-inferred-assignment</span></div>)}{selectedHandoffs.length === 0 && <EmptyMapping>Nenhum handoff mapeado no modelo atual.</EmptyMapping>}</div>
          <h4>Sistemas utilizados pelas atividades vinculadas</h4>
          <div className="tag-list">{systemIds.map((id) => <span className="tag" key={id}>{catalog.systems.find((item) => item.id === id)?.name ?? id}</span>)}{systemIds.length === 0 && <span className="muted">Não determinado.</span>}</div>
          <h4>Fontes</h4><EvidenceList sources={selected.sources} />
        </>}
      </aside>
    </div>
  </ResourcePageLayout>
}

function ActorNetwork({ catalog, selectedActorId, onSelect }: { catalog: FrontendCatalog; selectedActorId?: string; onSelect: (actorId: string) => void }) {
  const twin = useMemo(() => buildTwinModel(catalog), [catalog])
  const position = (x: number, z: number) => ({ x: 430 + x * 42, y: 270 + z * 26 })
  const areaById = new Map(twin.areas.map((area) => [area.actorId, area]))
  return <div className="actor-network-wrap"><svg className="actor-network" viewBox="0 0 860 540" role="img" aria-label="Rede conceitual dos 31 participantes e handoffs agregados">
    <defs><marker id="network-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>
    <g className="actor-network-edges">{twin.routes.map((route) => {
      const from = areaById.get(route.fromActorId); const to = areaById.get(route.toActorId)
      if (!from || !to) return null
      const a = position(from.position[0], from.position[2]); const b = position(to.position[0], to.position[2])
      return <line key={route.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={route.fromActorId === selectedActorId || route.toActorId === selectedActorId ? 'is-related' : ''} markerEnd="url(#network-arrow)" />
    })}</g>
    <g>{twin.areas.map((area) => { const point = position(area.position[0], area.position[2]); const selected = area.actorId === selectedActorId; return <g key={area.actorId} className={`actor-network-node actor-network-${area.classification} ${selected ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`${area.name}, ${classificationLabel(area.classification)}, inferido`} onClick={() => onSelect(area.actorId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(area.actorId) }}><circle cx={point.x} cy={point.y} r={selected ? 17 : 12} /><text x={point.x} y={point.y + 28} textAnchor="middle">{area.name.length > 21 ? `${area.name.slice(0, 20)}…` : area.name}</text></g> })}</g>
  </svg><div className="network-legend"><span><i className="participant-internal" /> Interno</span><span><i className="participant-external" /> Externo</span><span><i className="participant-unknown" /> Não determinado</span><span>Setas indicam origem → destino</span></div></div>
}

function HandoffMatrix({ catalog, handoffs, selectedActorId, onSelect }: { catalog: FrontendCatalog; handoffs: Handoff[]; selectedActorId?: string; onSelect: (actorId: string) => void }) {
  const actorIds = catalog.actors.map((actor) => actor.id)
  const matrix = buildHandoffMatrix(handoffs, actorIds)
  return <div className="matrix-scroll"><table className="handoff-matrix"><caption>Linhas representam origem; colunas representam destino.</caption><thead><tr><th>Origem ↓ / destino →</th>{matrix.actorIds.map((id) => <th key={id} title={actorName(catalog, id)}>{actorName(catalog, id)?.slice(0, 3).toUpperCase()}</th>)}</tr></thead><tbody>{matrix.actorIds.map((fromId) => <tr key={fromId} className={fromId === selectedActorId ? 'is-selected' : ''}><th><button onClick={() => onSelect(fromId)}>{actorName(catalog, fromId)}</button></th>{matrix.actorIds.map((toId) => { const count = matrix.counts[`${fromId}->${toId}`] ?? 0; return <td key={toId} className={count ? 'has-value' : ''} title={`${actorName(catalog, fromId)} → ${actorName(catalog, toId)}: ${count} handoffs mapeados`}>{count || '·'}</td> })}</tr>)}</tbody></table></div>
}

export function SystemsPage({ catalog }: PageProps) {
  const [params, setParams] = useSearchParams()
  const kind = params.get('kind') === 'channels' || params.get('kind') === 'artifacts' ? params.get('kind') as 'channels' | 'artifacts' : 'systems'
  const channels = useMemo(() => groupChannels(catalog.channels), [catalog.channels])
  const items = useMemo(() => kind === 'channels' ? channels : catalog[kind].map((item) => ({ ...item, memberIds: [item.id] })), [catalog, channels, kind])
  const selected = items.find((item) => item.memberIds.includes(params.get('resource') ?? '')) ?? items[0]
  const related = useRelatedActivities(catalog, undefined, selected?.id, selected?.memberIds)
  const setKind = (next: 'systems' | 'channels' | 'artifacts') => { const copy = new URLSearchParams(); copy.set('kind', next); setParams(copy, { replace: true }) }
  const setSelected = (id: string) => { const copy = new URLSearchParams(params); copy.set('resource', id); setParams(copy, { replace: true }) }
  const labels = { systems: 'Sistema', channels: 'Canal', artifacts: 'Artefato' }
  return <ResourcePageLayout eyebrow="Ferramentas e materiais de trabalho" title="Sistemas, canais e artefatos" description="Encontre ferramentas, meios de comunicação e documentos citados nas atividades; abra os processos e as fontes relacionados.">
    <div className="resource-tabs" role="tablist" aria-label="Categoria de informação">{(['systems', 'channels', 'artifacts'] as const).map((tab) => <button role="tab" aria-selected={kind === tab} className={kind === tab ? 'is-active' : ''} key={tab} onClick={() => setKind(tab)}>{tab === 'systems' ? `Sistemas · ${catalog.systems.length}` : tab === 'channels' ? `Canais · ${channels.length}` : `Artefatos · ${catalog.artifacts.length}`}</button>)}</div>
    <div className="resource-layout refined-resource-layout">
      <div className="resource-list" role="tabpanel">
        {items.map((item) => {
          const Icon = kind === 'systems' ? Monitor : kind === 'artifacts' ? FileText : item.name === 'E-mail' ? Mail : item.name === 'Grupo de WhatsApp' ? Users : MessageCircle
          const subtitle = kind === 'channels' ? item.name === 'E-mail' ? 'Correio eletrônico' : item.name === 'Grupo de WhatsApp' ? 'Conversa em grupo' : 'Canal de comunicação' : labels[kind]
          return <button className={`resource-row ${item.id === selected?.id ? 'is-selected' : ''}`} key={item.id} onClick={() => setSelected(item.id)}><span className="resource-icon"><Icon size={18} aria-hidden="true" /></span><span><strong>{item.name}</strong><small>{subtitle}</small></span><ArrowRight size={16} aria-hidden="true" /></button>
        })}
      </div>
      <div className="resource-detail">{selected && <>
        <div className="panel-heading"><div><span className="eyebrow">{labels[kind]}</span><h2>{selected.name}</h2></div><ConfidenceBadge state={catalogItemConfidence(selected)} /></div>
        <p className="muted">{selected.aliases?.length ? `Aliases preservados: ${selected.aliases.join(', ')}` : 'Sem alias adicional documentado.'}</p>
        <h4>Processos relacionados</h4><div className="tag-list">{sourceProcessIds(selected.sources).map((id) => <Link className="tag" key={id} to={`/processos/${id}`}>{id}</Link>)}</div>
        <h4>Atividades associadas</h4>{related.loading ? <div className="skeleton-list"><i /><i /><i /></div> : <div className="linked-activity-list">{related.items.slice(0, 18).map((activity) => <Link key={activity.id} to={`/processos/${activity.processId}?activity=${encodeURIComponent(activity.id)}`}><span>{activity.processId}</span><strong>{activity.name}</strong></Link>)}{related.items.length === 0 && <EmptyMapping>Nenhuma atividade vinculada no mapeamento atual.</EmptyMapping>}</div>}
        <h4>Fontes</h4><EvidenceList sources={selected.sources} />
      </>}</div>
    </div>
  </ResourcePageLayout>
}

export function HandoffsPage({ catalog, overview = false }: PageProps & { overview?: boolean }) {
  const allHandoffs = catalog.handoffs as Handoff[]
  const [params, setParams] = useSearchParams()
  const view = normalizeRelationshipView(params.get('view'))
  const [query, setQuery] = useState('')
  const [processId, setProcessId] = useState('')
  const [fromActorId, setFromActorId] = useState('')
  const [toActorId, setToActorId] = useState('')
  const [confidence, setConfidence] = useState<DataConfidenceState | ''>('')
  const handoffs = filterHandoffs(allHandoffs, { query, processId, fromActorId, toActorId, confidence: confidence || undefined })
  const aggregate = aggregateConfidence(handoffs.map(handoffConfidence))
  const groups = groupHandoffsForReading(handoffs)
  const setView = (next: RelationshipView) => { const copy = new URLSearchParams(params); next === 'matrix' ? copy.set('view', 'matrix') : copy.delete('view'); setParams(copy, { replace: true }) }
  return <ResourcePageLayout className="handoffs-page" eyebrow={overview ? 'Visão operacional' : 'Roteamento operacional'} title={overview ? 'Passagens entre equipes' : 'Explorar passagens'} description="Consulte cada entrega entre equipes, o processo e as atividades de saída e chegada. Os participantes atribuídos continuam marcados como inferidos.">
    {<div className="handoff-overview-note"><p><strong>Como ler:</strong> as setas e atividades vêm dos diagramas Bizagi. Os participantes foram associados às atividades com base nos POP (Procedimentos Operacionais Padrão), documentos que descrevem como executar cada atividade; essa associação ainda é inferida. Abra as evidências de uma linha para consultar os arquivos de origem.</p><Link className="text-button" to="/?view=map">Abrir mapa de equipes e passagens →</Link></div>}
    <div className="module-toolbar handoff-filters">
      <label className="field-control"><span>Buscar atividade</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Processo ou atividade" /></label>
      <label className="field-control"><span>Processo</span><select value={processId} onChange={(event) => setProcessId(event.target.value)}><option value="">Todos os processos</option>{catalog.processes.map((process) => <option key={process.id} value={process.id}>{process.id} · {process.name}</option>)}</select></label>
      <label className="field-control"><span>Origem</span><select value={fromActorId} onChange={(event) => setFromActorId(event.target.value)}><option value="">Todas</option>{catalog.actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
      <label className="field-control"><span>Destino</span><select value={toActorId} onChange={(event) => setToActorId(event.target.value)}><option value="">Todos</option>{catalog.actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
      <label className="field-control"><span>Certeza</span><select value={confidence} onChange={(event) => setConfidence(event.target.value as DataConfidenceState | '')}><option value="">Todas</option><option value="READY_WITH_INFERENCE_BADGE">Inferido</option><option value="NEEDS_HUMAN_REVIEW">Precisa validação</option></select></label>
      <SegmentedControl value={view} onChange={setView} listLabel="Lista" />
    </div>
    <div className="handoff-summary" aria-live="polite">
      <p className="handoff-summary-statement">{handoffInferenceSummary(allHandoffs.length, handoffs.length)}</p>
      <div className="handoff-summary-status">
        <ConfidenceBadge state={aggregate} />
        <span>Contagem documental; não indica fluxo em tempo real nem ausência de relações fora das fontes.</span>
      </div>
    </div>
    {view === 'matrix' ? <section className="relationship-canvas standalone-matrix"><HandoffMatrix catalog={catalog} handoffs={handoffs} onSelect={(actorId) => setFromActorId(actorId)} /></section> : <section className="handoff-reading" aria-label="Passagens organizadas por processo">
      <div className="handoff-reading-guide"><strong>Leia por processo</strong><p>Passagens ordenadas pelos códigos das atividades de origem. Esta ordem ajuda a localizar as entregas; não representa uma sequência única de execução. O fluxo pode ter ramificações, retornos e diagramas diferentes. Abra “Ver fluxo” para acompanhar o caminho no Bizagi.</p></div>
      {groups.length > 1 && <nav className="handoff-process-index" aria-label="Ir para processo">{groups.map((group) => <a className="tag" key={group.processId} href={`#passagens-${group.processId}`}>{group.processId} · {catalog.processes.find((process) => process.id === group.processId)?.name} <span>({group.items.length})</span></a>)}</nav>}
      {groups.map((group) => <section className="handoff-process-group" id={`passagens-${group.processId}`} key={group.processId} aria-labelledby={`heading-${group.processId}`}>
        <header className="handoff-group-heading"><div><span className="eyebrow">{group.processId} · {group.items.length} passagens</span><h2 id={`heading-${group.processId}`}>{catalog.processes.find((process) => process.id === group.processId)?.name ?? group.processId}</h2></div><Link className="text-button" to={`/processos/${group.processId}`}>Ver fluxo <ArrowRight size={16} aria-hidden="true" /></Link></header>
        <div className="handoff-reading-cards">{group.items.map((handoff) => {
          const activities = splitHandoffActivityNames(handoff.name)
          return <article className="handoff-reading-card" key={handoff.id} data-handoff-id={handoff.id}>
            <div className="handoff-card-transfer"><div><span className="handoff-field-label">Quem entrega</span><strong>{actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'}</strong></div><ArrowRight size={22} aria-hidden="true" /><div><span className="handoff-field-label">Quem recebe</span><strong>{actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}</strong></div></div>
            <div className="handoff-card-activities"><div><span className="handoff-field-label">Sai da atividade</span><Link to={`/processos/${handoff.processId}?activity=${encodeURIComponent(handoff.sourceNodeId)}`}>{activities.source || 'Atividade de origem não identificada'}</Link></div><div><span className="handoff-field-label">Chega na atividade</span><Link to={`/processos/${handoff.processId}?activity=${encodeURIComponent(handoff.targetNodeId)}`}>{activities.destination || 'Atividade de destino não identificada'}</Link></div></div>
            <footer className="handoff-card-evidence"><ConfidenceBadge state={handoffConfidence(handoff)} /><details className="handoff-evidence"><summary>Ver evidências</summary><EvidenceList sources={handoff.sources} /></details></footer>
          </article>
        })}</div>
      </section>)}
      {groups.length === 0 && <EmptyMapping>Nenhuma passagem encontrada com os filtros atuais.</EmptyMapping>}
    </section>}  </ResourcePageLayout>
}

interface Diagnostic {
  id: string
  code: string
  processId?: string
  message: string
  entityIds?: string[]
  sources: SourceReference[]
}

function entityLink(processId?: string, entityIds: string[] = []) {
  if (!processId) return undefined
  const activityId = entityIds.find((id) => id.includes(':node:'))
  return activityId ? `/processos/${processId}?activity=${encodeURIComponent(activityId)}` : `/processos/${processId}`
}

export function DocumentationPage({ catalog }: PageProps) {
  const [section, setSection] = useState<'sources' | 'conflicts' | 'ambiguities' | 'subflows' | 'readiness'>('sources')
  const conflicts = catalog.conflicts as ReviewConflict[]
  const diagnostics = catalog.diagnostics as Diagnostic[]
  const ambiguities = catalog.activityIndex.filter((activity) => activity.reconciliationStatus === 'ambiguous')
  const unresolved = diagnostics.filter((diagnostic) => diagnostic.code === 'UNRESOLVED_SUBFLOW')
  return <ResourcePageLayout eyebrow="Fontes e rastreabilidade" title="Centro de evidências" description="Confira de quais arquivos Bizagi e POP vêm os dados; examine conflitos, ambiguidades e lacunas antes de validar uma atribuição.">
    <div className="evidence-tabs" role="tablist">{([
      ['sources', 'Fontes'], ['conflicts', `Conflitos · ${conflicts.length}`], ['ambiguities', `Ambiguidades · ${ambiguities.length}`], ['subflows', `Subprocessos sem destino · ${unresolved.length}`], ['readiness', 'Confiabilidade dos dados'],
    ] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} className={section === id ? 'is-active' : ''} onClick={() => setSection(id)}>{label}</button>)}</div>
    <section className="evidence-center" role="tabpanel">
      {section === 'sources' && <><div className="documentation-grid"><article className="doc-card doc-card-primary"><span className="eyebrow">Modelo canônico</span><h2>Bizagi + POP</h2><p>Topologia Bizagi e procedimentos POP alimentam o mapa. Jira e Portal permanecem evidências externas de alinhamento.</p><div className="doc-counts"><span><strong>10</strong>processos</span><span><strong>14</strong>diagramas</span><span><strong>1.081</strong>linhas POP</span></div></article><article className="doc-card"><span className="eyebrow">Limites externos</span><h2>Diferenças preservadas</h2><p>Housekeeping permanece Jira/Portal-only. P009 Comercial não tem equivalente Portal confirmado. P010 Transbordo Importação não possui história Jira capturada.</p></article></div><div className="source-process-grid">{catalog.processes.map((process) => <Link key={process.id} to={`/processos/${process.id}`}><span>{process.id}</span><strong>{process.name}</strong><small>{process.sources.length} referências do processo</small></Link>)}</div></>}
      {section === 'conflicts' && <ReviewList title="Conflitos entre fontes" description="Nenhum vencedor foi escolhido." items={conflicts.map((conflict) => ({ id: conflict.id, title: `${conflict.processId} · ${conflict.field}`, detail: `Bizagi: ${conflict.bizagiValue ?? 'Não documentado'} · POP: ${conflict.popValue ?? 'Não documentado'}`, badge: 'needs-review', href: entityLink(conflict.processId, conflict.entityIds), sources: conflict.sources }))} />}
      {section === 'ambiguities' && <ReviewList title="Correspondências ambíguas" description="Candidatos múltiplos permanecem abertos." items={ambiguities.map((activity) => ({ id: activity.id, title: `${activity.processId} · ${activity.name}`, detail: 'Match ambíguo; consulte o processo e suas evidências.', badge: 'ambiguous', href: `/processos/${activity.processId}?activity=${encodeURIComponent(activity.id)}`, sources: [] }))} />}
      {section === 'subflows' && <ReviewList title="Subprocessos sem destino identificado" description="A fonte faz referência a um subprocesso cujo destino não foi localizado no material disponível." items={unresolved.map((diagnostic) => ({ id: diagnostic.id, title: `${diagnostic.processId} · destino não identificado`, detail: diagnostic.message, badge: 'unresolved', href: entityLink(diagnostic.processId, diagnostic.entityIds), sources: diagnostic.sources }))} />}
      {section === 'readiness' && <div className="readiness-reference">{(Object.keys(readinessCopy) as DataConfidenceState[]).map((state) => <article key={state}><ConfidenceBadge state={state} /><p>{readinessCopy[state].detail}</p></article>)}</div>}
    </section>
  </ResourcePageLayout>
}

function ReviewList({ title, description, items }: { title: string; description: string; items: Array<{ id: string; title: string; detail: string; badge: string; href?: string; sources: SourceReference[] }> }) {
  return <div className="review-list"><div className="relationship-heading"><div><span className="eyebrow">Revisão assistida</span><h2>{title}</h2><p>{description}</p></div><span>{items.length} registros</span></div>{items.map((item) => <article key={item.id} className="review-row"><span className={`review-symbol review-${item.badge}`} aria-label={item.badge}>{item.badge === 'unresolved' ? '—' : item.badge === 'ambiguous' ? '?' : '!'}</span><div><strong>{item.title}</strong><p>{item.detail}</p>{item.sources.length > 0 && <EvidenceList sources={item.sources.slice(0, 2)} />}</div>{item.href && <Link to={item.href}>Abrir no mapa →</Link>}</article>)}</div>
}

function ResourcePageLayout({ eyebrow, title, description, children, className = '' }: { eyebrow: string; title: string; description: string; children: ReactNode; className?: string }) {
  return <div className={`page-stack resource-page ${className}`}><PageHeader eyebrow={eyebrow} title={title} description={description} className="orion-page-header" />{children}</div>
}
