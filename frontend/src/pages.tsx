import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'

import { operationDataClient } from './data/client'
import { usePlaybackSession } from './data/playback-context'
import { advancePlayback, chooseBranch, resetPlayback } from './data/playback'
import { processSummaryConfidence, resolveProcessRequest } from './data/presentation'
import { buildTwinActivityMarkers, buildTwinModel, TWIN_DEFAULT_LAYERS, type TwinLayerKey, type TwinLayers } from './data/twin'
import { actorName, processDiagramGraph, sourceProcessIds } from './data/model'
import type { FrontendCatalog, Handoff, ProcessPayload } from './data/types'
import { ConfidenceBadge } from './components/ConfidenceBadge'
import { ActivityPanel } from './components/ActivityPanel'
import { EvidenceList } from './components/EvidenceList'
import { PlaybackBar } from './components/PlaybackBar'
import { ProcessGraph } from './components/ProcessGraph'
import { FocusFlow } from './components/FocusFlow'
import { OperationPassageDetails } from './components/OperationPassageDetails'
import { OperationalTwinPanel } from './components/OperationalTwinPanel'
import { PageHeader } from './components/orion/blocks'
import { Input } from './components/orion/ui'

const OperationalTwinScene = lazy(async () => ({ default: (await import('./components/OperationalTwinScene')).OperationalTwinScene }))

export interface PageProps {
  catalog: FrontendCatalog
}

export function OverviewPage({ catalog }: PageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = usePlaybackSession()
  const [layers, setLayers] = useState<TwinLayers>(TWIN_DEFAULT_LAYERS)
  const [camera, setCamera] = useState<{ mode: 'reset' | 'fit' | 'focus'; command: number }>({ mode: 'fit', command: 0 })
  const [selectedProcess, setSelectedProcess] = useState<ProcessPayload | null>(null)
  const selectedProcessId = searchParams.get('process') ?? undefined
  const selectedActorId = searchParams.get('area') ?? undefined
  const selectedActivityId = searchParams.get('activity') ?? undefined
  const selectedResourceId = searchParams.get('resource') ?? undefined
  const view = searchParams.get('view') === '2d' ? '2d' : '3d'
  const twin = useMemo(() => buildTwinModel(catalog), [catalog])

  useEffect(() => {
    if (!selectedProcessId || !catalog.processes.some((process) => process.id === selectedProcessId)) {
      setSelectedProcess(null)
      return
    }
    let active = true
    operationDataClient
      .loadProcess(selectedProcessId)
      .then((loaded) => {
        if (active) setSelectedProcess(loaded)
      })
      .catch(() => {
        if (active) setSelectedProcess(null)
      })
    return () => {
      active = false
    }
  }, [catalog.processes, selectedProcessId])

  const matchingPlaybackSession = session && session.processId === selectedProcessId ? session : null
  const playbackActivityId = matchingPlaybackSession?.state.currentNodeId ?? undefined
  const activityMarkers = useMemo(
    () => (selectedProcess ? buildTwinActivityMarkers(catalog, selectedProcess, twin.areas) : []),
    [catalog, selectedProcess, twin.areas],
  )
  const setSelection = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(values).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setSearchParams(next, { replace: true })
  }
  const clearSelection = () => setSelection({ process: undefined, area: undefined, activity: undefined, resource: undefined })
  const selectProcess = (processId: string) => {
    setSelection({ process: processId, area: undefined, activity: undefined, resource: undefined })
    setCamera((current) => ({ mode: 'focus', command: current.command + 1 }))
  }
  const selectActor = (actorId: string) => {
    setSelection({ area: actorId, process: undefined, activity: undefined, resource: undefined })
    setCamera((current) => ({ mode: 'focus', command: current.command + 1 }))
  }
  const selectActivity = (activityId: string) => setSelection({ activity: activityId, area: undefined, resource: undefined })
  const selectResource = (resourceId: string) => setSelection({ resource: resourceId, area: undefined, activity: undefined })
  const setView = (nextView: '2d' | '3d') => setSelection({ view: nextView === '2d' ? '2d' : undefined })
  const toggleLayer = (key: TwinLayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }))

  if (view === '2d')
    return (
      <Overview2D
        catalog={catalog}
        selectedProcessId={selectedProcessId}
        selectedActivityId={selectedActivityId}
        onUse3D={() => setSelection({ view: 'map' })}
      />
    )

  const selectedSummary = selectedProcessId ? catalog.processes.find((process) => process.id === selectedProcessId) : undefined
  const focusActivityId = selectedActivityId ?? playbackActivityId
  return (
    <div className="twin-page">
      <PageHeader
        eyebrow="Control Tower · modelo operacional carregado"
        title="Visão Geral 3D"
        description="Espaço operacional conceitual derivado de áreas, handoffs e fontes preservadas."
        className="twin-heading orion-page-header"
        actions={
          <div className="view-switch" aria-label="Modo da visualização">
            <button className="is-active" onClick={() => setView('3d')}>
              3D
            </button>
            <button onClick={() => setView('2d')}>2D</button>
          </div>
        }
      />
      <div className="twin-workspace">
        <section className="twin-stage">
          <Suspense
            fallback={
              <div className="twin-loading">
                <div className="twin-skeleton">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <span>Carregando módulo 3D sob demanda…</span>
              </div>
            }
          >
            <OperationalTwinScene
              model={twin}
              layers={layers}
              selectedProcessId={selectedProcessId}
              selectedActorId={selectedActorId}
              selectedActivityId={focusActivityId}
              selectedResourceId={selectedResourceId}
              activityMarkers={activityMarkers}
              traversedFlowIds={matchingPlaybackSession?.state.traversedFlowIds ?? []}
              cameraCommand={camera.command}
              cameraMode={camera.mode}
              onSelectProcess={selectProcess}
              onSelectActor={selectActor}
              onSelectActivity={selectActivity}
              onSelectResource={selectResource}
              onClearSelection={clearSelection}
              onUse2D={() => setView('2d')}
            />
          </Suspense>
          <div className="twin-stage-status">
            <span className="model-chip">● Modelo operacional carregado</span>
            <span>10 processos · 73 handoffs · sem geografia real</span>
          </div>
          <div className="twin-layers" aria-label="Camadas do mapa">
            <span className="eyebrow">Camadas</span>
            {(
              [
                ['areas', 'Áreas'],
                ['processes', 'Processos'],
                ['activities', 'Atividades'],
                ['systems', 'Sistemas'],
                ['decisions', 'Decisões'],
                ['handoffs', 'Handoffs'],
              ] as Array<[TwinLayerKey, string]>
            ).map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="twin-camera-tools">
            <button onClick={() => setCamera((current) => ({ mode: 'reset', command: current.command + 1 }))}>Resetar</button>
            <button onClick={() => setCamera((current) => ({ mode: 'fit', command: current.command + 1 }))}>Enquadrar</button>
            <button
              disabled={!selectedProcessId && !selectedActorId}
              onClick={() => setCamera((current) => ({ mode: 'focus', command: current.command + 1 }))}
            >
              Focar seleção
            </button>
          </div>
          {selectedSummary && (
            <div className="twin-focus-card">
              <span className="eyebrow">Processo em foco</span>
              <strong>
                {selectedSummary.id} · {selectedSummary.name}
              </strong>
              <span>
                {selectedSummary.actorCount} áreas · {selectedSummary.nodeTypes.task ?? 0} atividades · {selectedSummary.handoffCount}{' '}
                handoffs
              </span>
              <Link to={`/processos/${selectedSummary.id}`}>Ver processo →</Link>
            </div>
          )}
          {matchingPlaybackSession && (
            <div className="twin-playback-status" role="status">
              <span className="eyebrow">Playback compartilhado</span>
              <strong>{matchingPlaybackSession.state.currentNodeId ? 'Atividade atual destacada' : 'Aguardando início'}</strong>
              <span>
                {matchingPlaybackSession.state.visitedNodeIds.length} percorridos · {matchingPlaybackSession.state.traversedFlowIds.length}{' '}
                flows atravessados
              </span>
            </div>
          )}
          <div className="twin-legend">
            <span>
              <i className="legend-route" /> Processo selecionado
            </span>
            <span>
              <i className="legend-secondary" /> Processo secundário
            </span>
            <span>
              <i className="legend-inferred" /> Inferido
            </span>
            <span>
              <i className="legend-conflict" /> Conflito
            </span>
            <span>
              <i className="legend-unresolved" /> Unresolved
            </span>
          </div>
        </section>
        <OperationalTwinPanel
          catalog={catalog}
          model={twin}
          process={selectedProcess}
          selectedProcessId={selectedProcessId}
          selectedActorId={selectedActorId}
          selectedActivityId={selectedActivityId}
          selectedResourceId={selectedResourceId}
          onClear={clearSelection}
          onSelectActivity={selectActivity}
        />
      </div>
    </div>
  )
}

function Overview2D({
  catalog,
  selectedProcessId,
  selectedActivityId,
  onUse3D,
}: PageProps & { selectedProcessId?: string; selectedActivityId?: string; onUse3D: () => void }) {
  const navigate = useNavigate()
  const featured = catalog.processes.slice(0, 6)
  const diagnostics = catalog.diagnostics as Array<{ code?: string; message?: string; processId?: string }>
  return (
    <div className="page-stack overview-page">
      <PageHeader
        eyebrow="Control Tower · visão alternativa"
        title="Visão Geral 2D"
        description={
          selectedProcessId ? `Seleção preservada: ${selectedProcessId}${selectedActivityId ? ' · atividade em foco' : ''}` : undefined
        }
        className="twin-heading twin-heading-2d orion-page-header"
        actions={
          <div className="view-switch" aria-label="Modo da visualização">
            <button onClick={onUse3D}>Mapa de equipes</button>
            <button className="is-active" aria-pressed="true">
              2D
            </button>
          </div>
        }
      />
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Control Tower · operação documentada</span>
          <h1>
            Mapa Operacional
            <br />
            <em>Super Trans</em>
          </h1>
          <p>Navegue pelos processos reais, seus responsáveis inferidos, conexões e evidências Bizagi + POP.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/processos/P001')}>
              Abrir Importação <span>→</span>
            </button>
            <Link className="secondary-button" to="/processos">
              Explorar processos
            </Link>
          </div>
        </div>
        <div className="hero-diagram" aria-label="Visão conceitual do fluxo operacional">
          <div className="radar-ring ring-one" />
          <div className="radar-ring ring-two" />
          <div className="radar-core">
            <span>ST</span>
            <small>
              OPERATION
              <br />
              MODEL
            </small>
          </div>
          {featured.slice(0, 5).map((process, index) => (
            <button key={process.id} className={`radar-node radar-node-${index + 1}`} onClick={() => navigate(`/processos/${process.id}`)}>
              <i />
              {process.id}
              <strong>{process.name}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="operational-board">
        <div className="board-heading">
          <div>
            <span className="eyebrow">Radar operacional</span>
            <h2>Rotas em foco</h2>
          </div>
          <span className="board-note">2D · topologia conceitual · sem geografia real</span>
        </div>
        <div className="route-list">
          {catalog.processes.map((process, index) => (
            <button
              className={`route-row ${process.id === selectedProcessId ? 'is-selected' : ''}`}
              key={process.id}
              onClick={() =>
                navigate(
                  process.id === selectedProcessId && selectedActivityId
                    ? `/processos/${process.id}?activity=${encodeURIComponent(selectedActivityId)}`
                    : `/processos/${process.id}`,
                )
              }
            >
              <span className="route-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="route-name">
                <strong>{process.name}</strong>
                <small>
                  {process.id} · {process.diagramCount} diagramas · {process.nodeCount} elementos
                </small>
              </span>
              <span className="route-line">
                <i style={{ width: `${Math.min(100, Math.max(22, process.nodeCount / 3))}%` }} />
              </span>
              <span className="route-signal">
                {process.conflictCount > 0 ? `${process.conflictCount} conflitos` : 'Sem conflito mapeado'} <span>→</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="overview-grid">
        <div className="signal-card">
          <div className="board-heading">
            <div>
              <span className="eyebrow">Sinais de revisão</span>
              <h2>O que pede atenção</h2>
            </div>
            <Link to="/documentacao">Ver documentação →</Link>
          </div>
          <div className="signal-list">
            <div className="signal-item signal-amber">
              <span className="signal-icon">!</span>
              <div>
                <strong>{catalog.summary.conflicts} conflitos</strong>
                <p>Valores Bizagi e POP permanecem em needs-review.</p>
              </div>
            </div>
            <div className="signal-item signal-purple">
              <span className="signal-icon">?</span>
              <div>
                <strong>2 ambiguidades</strong>
                <p>Candidatos múltiplos ainda sem decisão humana.</p>
              </div>
            </div>
            <div className="signal-item signal-muted">
              <span className="signal-icon">—</span>
              <div>
                <strong>{catalog.summary.unresolvedSubflows} SubFlows unresolved</strong>
                <p>Destinos não determinados, sem ligação fictícia.</p>
              </div>
            </div>
            {diagnostics
              .filter((item) => item.code === 'UNRESOLVED_SUBFLOW')
              .slice(0, 1)
              .map((item) => (
                <span key={item.processId} className="signal-footnote">
                  Exemplo: {item.processId} · {item.message}
                </span>
              ))}
          </div>
        </div>
        <div className="actors-card">
          <div className="board-heading">
            <div>
              <span className="eyebrow">Rede de participantes</span>
              <h2>Áreas na operação</h2>
            </div>
            <Link to="/areas">Abrir áreas →</Link>
          </div>
          <div className="actor-orbit">
            {catalog.actors.slice(0, 8).map((actor, index) => (
              <span key={actor.id} className={`actor-pill actor-pill-${index % 4}`} title={actor.name}>
                {actor.name}
              </span>
            ))}
          </div>
          <div className="actor-summary">
            <strong>31</strong>
            <span>
              atores catalogados
              <br />
              <small>lanes com atribuição geométrica</small>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export function ProcessesPage({ catalog }: PageProps) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase('pt-BR')
  const processes = catalog.processes.filter(
    (process) => !normalized || `${process.id} ${process.name}`.toLocaleLowerCase('pt-BR').includes(normalized),
  )
  return (
    <div className="page-stack">
      <div className="processes-page-header">
        <PageHeader
          eyebrow="Catálogo operacional"
          title="Processos"
          description="Abra um processo para ver suas etapas e decisões no Bizagi, acompanhar o avanço e consultar instruções e evidências POP."
          className="orion-page-header"
        />
        <label className="catalog-search">
          <span aria-hidden="true">⌕</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar processos"
            aria-label="Filtrar processos"
          />
        </label>
      </div>
      <div className="process-grid">
        {processes.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
      </div>
    </div>
  )
}

function ProcessCard({ process }: { process: FrontendCatalog['processes'][number] }) {
  const readiness = processSummaryConfidence(process)
  return (
    <Link className="process-card" to={`/processos/${process.id}`}>
      <div className="card-topline">
        <span className="process-code">{process.id}</span>
        <ConfidenceBadge state={readiness} compact />
        <span className="card-arrow">↗</span>
      </div>
      <h2>{process.name}</h2>
      <p className="process-objective">{process.objective || 'Objetivo documentado nas fontes.'}</p>
      <div className="card-metrics">
        <Metric label="Atividades" value={process.nodeTypes.task ?? 0} />
        <Metric label="Decisões" value={process.nodeTypes.gateway ?? 0} />
        <Metric label="Atores" value={process.actorCount} />
        <Metric label="Handoffs" value={process.handoffCount} />
      </div>
      <div className="card-footer">
        <span>
          {process.diagramCount} diagramas · {process.systemCount} sistemas · {process.unresolvedSubflowCount} unresolved
        </span>
        {process.conflictCount > 0 ? (
          <span className="card-alert">{process.conflictCount} conflitos</span>
        ) : (
          <span className="card-ok">Sem conflito mapeado</span>
        )}
      </div>
    </Link>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export function ProcessDetailPage({ catalog, processId }: PageProps & { processId: string }) {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [searchParams] = useSearchParams()
  const requestedActivity = searchParams.get('activity')
  const [process, setProcess] = useState<ProcessPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [diagramId, setDiagramId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(requestedActivity)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [invalidActivity, setInvalidActivity] = useState<string | null>(null)
  const [detailView, setDetailView] = useState<'focus' | 'diagram'>('focus')
  const [infoOpen, setInfoOpen] = useState(false)
  const [passageId, setPassageId] = useState<string | null>(null)
  const [explorationHistory, setExplorationHistory] = useState<string[]>([])
  useEffect(() => {
    if (navigationType === 'POP') setExplorationHistory([])
  }, [navigationType, requestedActivity])
  const infoDialog = useRef<HTMLDialogElement>(null)
  const requestedDiagram = searchParams.get('diagram')
  useEffect(() => {
    setInfoOpen(false)
    setPassageId(null)
    setExplorationHistory([])
    setDetailView('focus')
  }, [processId])
  useEffect(() => {
    if (infoOpen && !infoDialog.current?.open) infoDialog.current?.showModal()
    else if (!infoOpen && infoDialog.current?.open) infoDialog.current.close()
  }, [infoOpen])
  const { session, ensureSession, updateSession } = usePlaybackSession()

  const knownProcess = catalog.processes.some((item) => item.id === processId)
  useEffect(() => {
    if (!knownProcess) return
    let active = true
    setProcess(null)
    setError(null)
    operationDataClient
      .loadProcess(processId)
      .then((loaded) => {
        if (active) setProcess(loaded)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Falha ao carregar processo.')
      })
    return () => {
      active = false
    }
  }, [knownProcess, loadAttempt, processId])
  useEffect(() => {
    if (!process) return
    const resolution = resolveProcessRequest(
      catalog.processes.map((item) => item.id),
      processId,
      process,
      requestedActivity,
    )
    if (resolution.status === 'activity-not-found') {
      setInvalidActivity(requestedActivity)
      setDiagramId(resolution.diagramId)
      setSelectedNodeId(null)
      return
    }
    if (resolution.status === 'ready') {
      setInvalidActivity(null)
      setDiagramId(
        !requestedActivity && process.diagrams.some((item) => item.id === requestedDiagram) ? requestedDiagram : resolution.diagramId,
      )
      setSelectedNodeId(resolution.nodeId ?? null)
    }
  }, [process, requestedActivity, requestedDiagram])

  const diagram = process?.diagrams.find((candidate) => candidate.id === diagramId) ?? process?.diagrams[0]
  const graph = useMemo(() => (diagram ? processDiagramGraph(diagram) : { nodes: [], flows: [] }), [diagram])
  useEffect(() => {
    if (process && diagram) ensureSession(process.id, diagram.id, graph)
  }, [diagram, ensureSession, graph, process])
  const activeSession = session && session.processId === process?.id && session.diagramId === diagram?.id ? session : null
  const playback = activeSession
    ? activeSession.state
    : { currentNodeId: null, visitedNodeIds: [], traversedFlowIds: [], isPlaying: false, pendingBranchNodeId: null, branchOptions: [] }
  useEffect(() => {
    if (!process || !diagram || !playback.isPlaying) return
    const timer = window.setInterval(() => updateSession(process.id, diagram.id, (current) => advancePlayback(current, graph)), 850)
    return () => window.clearInterval(timer)
  }, [diagram, graph, playback.isPlaying, process, updateSession])

  if (!knownProcess)
    return (
      <div className="state-panel state-panel-contained">
        <span className="state-symbol" aria-hidden="true">
          ?
        </span>
        <span className="eyebrow">Processo</span>
        <h1>Processo não encontrado no modelo atual.</h1>
        <p>O identificador {processId} não faz parte dos dez processos canônicos.</p>
        <Link className="primary-button" to="/processos">
          Voltar ao catálogo
        </Link>
      </div>
    )
  if (error)
    return (
      <div className="state-panel state-panel-contained">
        <span className="state-symbol" aria-hidden="true">
          !
        </span>
        <span className="eyebrow">Processo</span>
        <h1>Não foi possível carregar {processId}</h1>
        <p>{error}</p>
        <div className="state-actions">
          <button className="primary-button" onClick={() => setLoadAttempt((value) => value + 1)}>
            Tentar novamente
          </button>
          <Link className="secondary-button" to="/processos">
            Voltar
          </Link>
        </div>
      </div>
    )
  if (!process || !diagram) return <ProcessSkeleton processId={processId} />
  const summary = catalog.processes.find((item) => item.id === process.id)
  const focusNodeId = selectedNodeId ?? playback.currentNodeId
  const selectedPassage = (catalog.handoffs as Handoff[]).find((item) => item.processId === process.id && item.id === passageId)
  const processPassages = (catalog.handoffs as Handoff[]).filter((item) => item.processId === process.id)
  const selectedNode = diagram.nodes.find((node) => node.id === focusNodeId) ?? null
  const currentNode = diagram.nodes.find((node) => node.id === playback.currentNodeId)
  const nodeNames = new Map<string, string>(diagram.nodes.map((node) => [node.id, node.name.trim()] as const))
  const pathNames = playback.visitedNodeIds
    .map((id) => diagram.nodes.find((node) => node.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => name.trim())
  const handoffs = (catalog.handoffs as Handoff[]).filter(
    (handoff) => handoff.processId === process.id && playback.traversedFlowIds.includes(handoff.flowId),
  )
  const navigateNode = (nodeId: string) => {
    if (playback.isPlaying) updateSession(process.id, diagram.id, (state) => ({ ...state, isPlaying: false }))
    navigate(`/operacao/${process.id}?activity=${encodeURIComponent(nodeId)}`)
  }
  const selectNode = (nodeId: string) => {
    if (focusNodeId && focusNodeId !== nodeId) setExplorationHistory((history) => [...history, focusNodeId])
    navigateNode(nodeId)
  }
  const backInExploration = () => {
    const nodeId = explorationHistory[explorationHistory.length - 1]
    if (nodeId) {
      setExplorationHistory((history) => history.slice(0, -1))
      navigateNode(nodeId)
    }
  }
  const followPlayback = () => {
    setExplorationHistory([])
    setSelectedNodeId(null)
    navigate(`/operacao/${process.id}?diagram=${encodeURIComponent(diagram.id)}`, { replace: true })
  }
  const previous = () => {
    followPlayback()
    updateSession(process.id, diagram.id, (state) => {
      if (state.visitedNodeIds.length <= 1) return state
      const visited = state.visitedNodeIds.slice(0, -1)
      return {
        ...state,
        currentNodeId: visited[visited.length - 1],
        visitedNodeIds: visited,
        traversedFlowIds: state.traversedFlowIds.slice(0, -1),
        isPlaying: false,
        pendingBranchNodeId: null,
        branchOptions: [],
      }
    })
  }
  const first = () => {
    followPlayback()
    updateSession(process.id, diagram.id, resetPlayback(graph))
  }
  const next = () => {
    followPlayback()
    updateSession(process.id, diagram.id, (state) => advancePlayback(state, graph))
  }
  const togglePlay = () => {
    followPlayback()
    updateSession(process.id, diagram.id, (state) => (state.pendingBranchNodeId ? state : { ...state, isPlaying: !state.isPlaying }))
  }
  const choose = (flowId: string) => {
    followPlayback()
    updateSession(process.id, diagram.id, (state) => chooseBranch(state, graph, flowId))
  }
  const diagramIndex = process.diagrams.findIndex((item) => item.id === diagram.id)
  const diagramLabel = `Diagrama ${String(diagramIndex + 1).padStart(2, '0')} de ${String(process.diagrams.length).padStart(2, '0')}`
  return (
    <div className="process-detail operation-page">
      <div className="operation-toolbar">
        <label className="field-control operation-process-picker">
          <span className="sr-only">Processo</span>
          <select aria-label="Selecionar processo" value={process.id} onChange={(event) => navigate(`/operacao/${event.target.value}`)}>
            {catalog.processes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-control process-diagram-picker">
          <span className="sr-only">Diagrama do processo</span>
          <select
            aria-label="Diagrama do processo"
            value={diagram.id}
            onChange={(event) => {
              setExplorationHistory([])
              setDiagramId(event.target.value)
              setSelectedNodeId(null)
              setInfoOpen(false)
              navigate(`/operacao/${process.id}?diagram=${encodeURIComponent(event.target.value)}`, { replace: true })
            }}
          >
            {process.diagrams.map((item, index) => (
              <option key={item.id} value={item.id}>
                {index + 1} de {process.diagrams.length} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-control operation-step-picker">
          <span className="sr-only">Ir para atividade, evento ou decisão</span>
          <select
            aria-label="Ir para atividade, evento ou decisão"
            title={selectedNode?.name.trim()}
            value={focusNodeId ?? ''}
            onChange={(event) => {
              setDetailView('focus')
              selectNode(event.target.value)
            }}
          >
            <option value="" disabled>
              Selecione uma etapa
            </option>
            {diagram.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name.trim() || node.type}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button operation-view-toggle"
          aria-pressed={detailView === 'diagram'}
          onClick={() => setDetailView(detailView === 'focus' ? 'diagram' : 'focus')}
        >
          {detailView === 'focus' ? 'Diagrama completo Bizagi' : 'Voltar à etapa em foco'}
        </button>
      </div>
      <header className="operation-identity">
        <span className="process-code">{process.id}</span>
        <h1>{process.name}</h1>
        <span>
          · {diagramLabel} · {diagram.name}
        </span>
      </header>
      {invalidActivity && (
        <div className="inline-notice" role="status">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Atividade não encontrada neste processo.</strong>
            <p>O processo permanece aberto no primeiro diagrama. Referência solicitada: {invalidActivity}</p>
          </div>
          <button onClick={() => navigate(`/operacao/${process.id}`, { replace: true })}>Limpar referência</button>
        </div>
      )}
      {detailView === 'focus' ? (
        <FocusFlow
          process={process}
          diagram={diagram}
          catalog={catalog}
          nodeId={focusNodeId}
          canGoBack={explorationHistory.length > 0}
          onBack={backInExploration}
          onSelect={selectNode}
          onDetails={() => {
            setPassageId(null)
            setInfoOpen(true)
          }}
          onPassage={(id) => {
            setPassageId(id)
            setInfoOpen(true)
          }}
        />
      ) : (
        <main className="graph-column process-full-diagram">
          <div className="graph-toolbar">
            <div>
              <span className="eyebrow">Topologia completa do Bizagi</span>
              <h2>{diagram.name}</h2>
            </div>
            <span className="toolbar-hint">Selecione um elemento para explorar sua etapa</span>
          </div>
          <ProcessGraph
            diagram={diagram}
            catalog={catalog}
            selectedNodeId={focusNodeId}
            currentNodeId={playback.currentNodeId}
            visitedNodeIds={playback.visitedNodeIds}
            traversedFlowIds={playback.traversedFlowIds}
            onSelect={(node) => {
              selectNode(node.id)
              setDetailView('focus')
            }}
          />
          <div className="source-strip">
            <span>Fonte: {diagram.sources[0]?.file ?? 'Não documentada'}</span>
          </div>
        </main>
      )}
      <p className="team-map-note">
        Setas e opções vêm das ligações originais do diagrama Bizagi selecionado. Participantes continuam inferidos; passagens entre equipes
        vêm somente do catálogo documentado.
      </p>
      <dialog
        ref={infoDialog}
        className="team-map-drawer process-info-drawer"
        aria-label="Informações e evidências da operação"
        onCancel={() => setInfoOpen(false)}
        onClose={() => setInfoOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setInfoOpen(false)
        }}
      >
        <div>
          {selectedPassage ? (
            <OperationPassageDetails
              catalog={catalog}
              handoff={selectedPassage}
              onSelectNode={(nodeId) => {
                selectNode(nodeId)
                setInfoOpen(false)
              }}
              onClose={() => setInfoOpen(false)}
            />
          ) : (
            <ActivityPanel
              process={process}
              diagram={diagram}
              node={selectedNode}
              catalog={catalog}
              onSelectNode={(nodeId) => {
                selectNode(nodeId)
                setInfoOpen(false)
              }}
              onClose={() => setInfoOpen(false)}
              showAllEvidence
            />
          )}
          <details className="process-diagram-sources">
            <summary>Fontes do diagrama</summary>
            <EvidenceList sources={diagram.sources} showAll />
          </details>
        </div>
      </dialog>
      <details className="process-summary">
        <summary>
          Resumo do processo · {summary?.nodeTypes.task ?? 0} atividades · {summary?.conflictCount ?? 0} conflitos para revisar
        </summary>
        <div className="process-stat-strip">
          <Stat value={summary?.nodeTypes.task ?? 0} label="atividades" />
          <Stat value={summary?.actorCount ?? 0} label="participantes · inferidos" />
          <Stat value={summary?.systemCount ?? 0} label="sistemas" />
          <Stat value={summary?.handoffCount ?? 0} label="passagens" />
          <Stat value={summary?.conflictCount ?? 0} label="conflitos" tone="warning" />
        </div>
        <label className="field-control operation-passage-picker">
          <span>Ir para passagem entre equipes</span>
          <select
            value={infoOpen ? (selectedPassage?.id ?? '') : ''}
            onChange={(event) => {
              const handoff = processPassages.find((item) => item.id === event.target.value)
              if (handoff) {
                selectNode(handoff.sourceNodeId)
                setPassageId(handoff.id)
                setInfoOpen(true)
              }
            }}
          >
            <option value="">Selecione uma das {processPassages.length} passagens documentadas</option>
            {processPassages.map((item) => (
              <option key={item.id} value={item.id}>
                {actorName(catalog, item.fromActorId)} → {actorName(catalog, item.toActorId)} · {item.name}
              </option>
            ))}
          </select>
        </label>
      </details>
      <details className="process-guided-playback">
        <summary>Reprodução guiada do fluxo</summary>
        <PlaybackBar
          state={playback}
          currentName={currentNode?.name?.trim() ?? 'Aguardando início'}
          pathNames={pathNames}
          nodeNames={nodeNames}
          handoffCount={handoffs.length}
          onFirst={first}
          onPrevious={previous}
          onTogglePlay={togglePlay}
          onNext={next}
          onReset={first}
          onChooseBranch={choose}
        />
      </details>
    </div>
  )
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: 'warning' }) {
  return (
    <div className={tone ? 'stat-warning' : ''}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ProcessSkeleton({ processId }: { processId: string }) {
  return (
    <div className="process-skeleton" aria-label={`Carregando processo ${processId}`}>
      <div className="skeleton-heading">
        <i />
        <i />
      </div>
      <div className="skeleton-stats">
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <div className="skeleton-workspace">
        <div>
          <i />
          <i />
          <i />
          <i />
        </div>
        <aside>
          <i />
          <i />
          <i />
        </aside>
      </div>
      <span className="sr-only">Carregando processo e diagramas…</span>
    </div>
  )
}

export function AreasPage({ catalog }: PageProps) {
  const [selectedId, setSelectedId] = useState(catalog.actors[0]?.id)
  const actor = catalog.actors.find((item) => item.id === selectedId) ?? catalog.actors[0]
  const handoffs = (catalog.handoffs as Handoff[]).filter((handoff) => handoff.fromActorId === actor?.id || handoff.toActorId === actor?.id)
  return (
    <ResourcePageLayout
      eyebrow="Rede operacional"
      title="Áreas e responsabilidades"
      description="Atribuições derivadas de lanes e POPs ficam identificadas como inferidas."
    >
      <div className="resource-layout">
        <div className="resource-list">
          {catalog.actors.map((item) => (
            <button
              className={`resource-row ${item.id === actor?.id ? 'is-selected' : ''}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="resource-avatar">{item.name.slice(0, 1)}</span>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.classification ?? 'unknown'} · {sourceProcessIds(item.sources).length || '—'} processos
                </small>
              </span>
              <span>→</span>
            </button>
          ))}
        </div>
        <div className="resource-detail">
          {actor && (
            <>
              <span className="eyebrow">Área selecionada</span>
              <h2>{actor.name}</h2>
              <ConfidenceBadge state="READY_WITH_INFERENCE_BADGE" />
              <h4>Processos relacionados</h4>
              <div className="tag-list">
                {sourceProcessIds(actor.sources).map((id) => (
                  <span className="tag" key={id}>
                    {id}
                  </span>
                ))}
              </div>
              <h4>Handoffs de entrada e saída</h4>
              {handoffs.slice(0, 8).map((handoff) => (
                <div className="handoff-mini" key={handoff.id}>
                  <strong>
                    {actorName(catalog, handoff.fromActorId) ?? 'Origem'} → {actorName(catalog, handoff.toActorId) ?? 'Destino'}
                  </strong>
                  <span>derived-from-inferred-assignment · {handoff.processId}</span>
                </div>
              ))}
              {handoffs.length === 0 && <p className="muted">Nenhum handoff catalogado.</p>}
              <h4>Fontes</h4>
              <EvidenceList sources={actor.sources} />
            </>
          )}
        </div>
      </div>
    </ResourcePageLayout>
  )
}

export function SystemsPage({ catalog }: PageProps) {
  const [kind, setKind] = useState<'systems' | 'channels' | 'artifacts'>('systems')
  const [selectedId, setSelectedId] = useState<string>()
  const items = catalog[kind]
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  return (
    <ResourcePageLayout
      eyebrow="Ecossistema de informação"
      title="Sistemas, canais e artefatos"
      description="Recursos aparecem separados conforme a classificação do modelo canônico."
    >
      <div className="resource-tabs">
        {(['systems', 'channels', 'artifacts'] as const).map((tab) => (
          <button
            className={kind === tab ? 'is-active' : ''}
            key={tab}
            onClick={() => {
              setKind(tab)
              setSelectedId(undefined)
            }}
          >
            {tab === 'systems'
              ? `Sistemas · ${catalog.systems.length}`
              : tab === 'channels'
                ? `Canais · ${catalog.channels.length}`
                : `Artefatos · ${catalog.artifacts.length}`}
          </button>
        ))}
      </div>
      <div className="resource-layout">
        <div className="resource-list">
          {items.map((item) => (
            <button
              className={`resource-row ${item.id === selected?.id ? 'is-selected' : ''}`}
              key={item.id}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="resource-icon">{kind === 'systems' ? '◈' : kind === 'channels' ? '⌁' : '▤'}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.aliases?.join(' · ') || item.classification || 'catalogado'}</small>
              </span>
              <span>→</span>
            </button>
          ))}
        </div>
        <div className="resource-detail">
          {selected && (
            <>
              <span className="eyebrow">{kind === 'systems' ? 'Sistema' : kind === 'channels' ? 'Canal' : 'Artefato'}</span>
              <h2>{selected.name}</h2>
              <div className="tag-list">
                {sourceProcessIds(selected.sources).map((id) => (
                  <span className="tag" key={id}>
                    {id}
                  </span>
                ))}
              </div>
              <h4>Fontes</h4>
              <EvidenceList sources={selected.sources} />
            </>
          )}
        </div>
      </div>
    </ResourcePageLayout>
  )
}

export function HandoffsPage({ catalog }: PageProps) {
  const [filter, setFilter] = useState('')
  const handoffs = (catalog.handoffs as Handoff[]).filter(
    (handoff) => !filter || `${handoff.processId} ${handoff.name}`.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR')),
  )
  return (
    <ResourcePageLayout
      eyebrow="Roteamento operacional"
      title="Handoffs"
      description="Transições entre responsáveis derivadas de flows e executores POP. A classificação permanece inferida."
    >
      <div className="inline-filter">
        <span>⌕</span>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar por processo ou atividade" />
      </div>
      <div className="handoff-table">
        <div className="handoff-table-head">
          <span>Origem → destino</span>
          <span>Processo</span>
          <span>Classificação</span>
        </div>
        {handoffs.map((handoff) => (
          <div className="handoff-table-row" key={handoff.id}>
            <div>
              <strong>
                {actorName(catalog, handoff.fromActorId) ?? 'Origem não determinada'} →{' '}
                {actorName(catalog, handoff.toActorId) ?? 'Destino não determinado'}
              </strong>
              <small>{handoff.name}</small>
            </div>
            <span className="process-code">{handoff.processId}</span>
            <span className="inferred-label">◇ derived-from-inferred-assignment</span>
          </div>
        ))}
      </div>
    </ResourcePageLayout>
  )
}

export function DocumentationPage({ catalog }: PageProps) {
  const readiness = ['READY', 'READY_WITH_INFERENCE_BADGE', 'READY_WITH_SOURCE_CONFLICT', 'NEEDS_HUMAN_REVIEW', 'NOT_AVAILABLE'] as const
  return (
    <ResourcePageLayout
      eyebrow="Fontes e rastreabilidade"
      title="Documentação"
      description="A camada de apresentação preserva a origem, a incerteza e o que ainda depende de validação humana."
    >
      <div className="documentation-grid">
        <section className="doc-card doc-card-primary">
          <span className="eyebrow">Modelo canônico</span>
          <h2>Bizagi + POP</h2>
          <p>
            Topologia Bizagi, procedimentos POP, IDs globais e locadores originais alimentam o mapa. Jira e Portal permanecem contexto
            externo.
          </p>
          <div className="doc-counts">
            <span>
              <strong>10</strong>processos
            </span>
            <span>
              <strong>14</strong>diagramas
            </span>
            <span>
              <strong>1.081</strong>POP steps
            </span>
          </div>
        </section>
        <section className="doc-card">
          <span className="eyebrow">Prontidão</span>
          <h2>Estados visíveis</h2>
          <div className="readiness-list">
            {readiness.map((state) => (
              <div key={state}>
                <ConfidenceBadge state={state} />
                <span>
                  {state === 'READY'
                    ? 'Fonte disponível'
                    : state === 'READY_WITH_INFERENCE_BADGE'
                      ? 'Inferência identificada'
                      : state === 'READY_WITH_SOURCE_CONFLICT'
                        ? 'Valores divergentes'
                        : state === 'NEEDS_HUMAN_REVIEW'
                          ? 'Pergunta aberta'
                          : 'Valor não determinado'}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="doc-card">
          <span className="eyebrow">Pendências</span>
          <h2>Revisão humana</h2>
          <div className="doc-counts doc-counts-large">
            <span>
              <strong>{catalog.summary.conflicts}</strong>conflitos
            </span>
            <span>
              <strong>2</strong>ambiguidades
            </span>
            <span>
              <strong>{catalog.summary.unresolvedSubflows}</strong>SubFlows
            </span>
          </div>
          <p className="muted">Nenhum conflito é resolvido pela interface.</p>
        </section>
        <section className="doc-card">
          <span className="eyebrow">Fontes</span>
          <h2>Rastreabilidade por elemento</h2>
          <p>Cada atividade permite consultar arquivo Bizagi, diagramId, elementId e linha POP quando houver correspondência.</p>
          <Link className="text-button" to="/processos/P001">
            Abrir exemplo em Importação →
          </Link>
        </section>
      </div>
    </ResourcePageLayout>
  )
}

function ResourcePageLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="page-stack resource-page">
      <div className="page-title-row">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
