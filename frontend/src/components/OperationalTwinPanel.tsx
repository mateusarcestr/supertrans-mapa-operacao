import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { ActivityPanel } from './ActivityPanel'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EvidenceList } from './EvidenceList'
import { sourceProcessIds } from '../data/model'
import type { OperationalTwinModel } from '../data/twin'
import type { FrontendCatalog, NamedCatalogItem, ProcessPayload } from '../data/types'

interface OperationalTwinPanelProps {
  catalog: FrontendCatalog
  model: OperationalTwinModel
  process?: ProcessPayload | null
  selectedProcessId?: string
  selectedActorId?: string
  selectedActivityId?: string
  selectedResourceId?: string
  onClear: () => void
  onSelectActivity: (activityId: string) => void
}

function processNames(catalog: FrontendCatalog, processIds: string[]) {
  const names = new Map(catalog.processes.map((process) => [process.id, process.name]))
  return processIds.map((id) => `${id} · ${names.get(id) ?? id}`)
}

function ResourceDetails({
  item,
  kind,
  catalog,
  onClear,
}: {
  item: NamedCatalogItem
  kind: string
  catalog: FrontendCatalog
  onClear: () => void
}) {
  const processes = processNames(catalog, sourceProcessIds(item.sources))
  return (
    <aside className="context-panel twin-context-panel" aria-label="Detalhes do recurso selecionado">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{kind}</span>
          <h2>{item.name}</h2>
        </div>
        <button className="icon-button" aria-label="Fechar painel" onClick={onClear}>
          ×
        </button>
      </div>
      <p className="field-note">Categoria preservada no modelo operacional. Não representa uma integração em tempo real.</p>
      <section className="panel-section">
        <h4>Processos relacionados</h4>
        {processes.length ? (
          <div className="tag-list">
            {processes.map((name) => (
              <span className="tag" key={name}>
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">Não documentado</p>
        )}
      </section>
      <section className="panel-section">
        <h4>Evidências</h4>
        <EvidenceList sources={item.sources} />
      </section>
    </aside>
  )
}

function AreaDetails({
  areaId,
  catalog,
  model,
  onClear,
}: {
  areaId: string
  catalog: FrontendCatalog
  model: OperationalTwinModel
  onClear: () => void
}) {
  const area = model.areas.find((item) => item.actorId === areaId)
  const actor = catalog.actors.find((item) => item.id === areaId)
  if (!area || !actor) return null
  const incoming = model.routes.filter((route) => route.toActorId === areaId)
  const outgoing = model.routes.filter((route) => route.fromActorId === areaId)
  return (
    <aside className="context-panel twin-context-panel" aria-label="Detalhes da área selecionada">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Área / participante</span>
          <h2>{area.name}</h2>
        </div>
        <button className="icon-button" aria-label="Fechar painel" onClick={onClear}>
          ×
        </button>
      </div>
      <ConfidenceBadge state={area.confidence} />
      <section className="panel-section">
        <h4>Classificação</h4>
        <p>{area.classification === 'unknown' ? 'Tipo não determinado' : area.classification}</p>
        <p className="field-note">Posicionamento conceitual; responsabilidades derivadas de lane continuam inferidas.</p>
      </section>
      <section className="panel-section">
        <h4>Processos relacionados</h4>
        <div className="tag-list">
          {processNames(catalog, area.processIds).map((name) => (
            <span className="tag" key={name}>
              {name}
            </span>
          ))}
        </div>
      </section>
      <section className="panel-section">
        <h4>Handoffs</h4>
        <p className="field-note">
          Entrada: {incoming.length} · saída: {outgoing.length}
        </p>
        <p className="field-note">derived-from-inferred-assignment</p>
      </section>
      <section className="panel-section">
        <h4>Evidências</h4>
        <EvidenceList sources={actor.sources} />
      </section>
    </aside>
  )
}

function ProcessDetails({
  processId,
  catalog,
  model,
  onClear,
}: {
  processId: string
  catalog: FrontendCatalog
  model: OperationalTwinModel
  onClear: () => void
}) {
  const process = catalog.processes.find((item) => item.id === processId)
  if (!process) return null
  const routes = model.routes.filter((route) => route.processId === processId)
  const areaIds = new Set(routes.flatMap((route) => [route.fromActorId, route.toActorId]))
  return (
    <aside className="context-panel twin-context-panel" aria-label="Resumo do processo selecionado">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Processo em foco</span>
          <h2>
            {process.id} · {process.name}
          </h2>
        </div>
        <button className="icon-button" aria-label="Fechar painel" onClick={onClear}>
          ×
        </button>
      </div>
      <p>{process.objective ?? 'Objetivo documentado nas fontes.'}</p>
      <div className="twin-summary-metrics">
        <span>
          <strong>{areaIds.size}</strong> áreas
        </span>
        <span>
          <strong>{process.nodeTypes.task ?? 0}</strong> atividades
        </span>
        <span>
          <strong>{process.systemCount}</strong> sistemas
        </span>
        <span>
          <strong>{process.handoffCount}</strong> handoffs
        </span>
      </div>
      {process.conflictCount > 0 && (
        <div className="attention-box">
          <strong>CONFLITOS PRESERVADOS</strong>
          <p>{process.conflictCount} conflito(s) continuam em needs-review. Nenhuma fonte foi escolhida como vencedora.</p>
        </div>
      )}
      <section className="panel-section">
        <h4>Evidências</h4>
        <EvidenceList sources={process.sources} />
      </section>
      <Link className="primary-button twin-open-process" to={`/processos/${process.id}`}>
        Ver processo <span>→</span>
      </Link>
    </aside>
  )
}

export function OperationalTwinPanel({
  catalog,
  model,
  process,
  selectedProcessId,
  selectedActorId,
  selectedActivityId,
  selectedResourceId,
  onClear,
  onSelectActivity,
}: OperationalTwinPanelProps) {
  const hasSelection = Boolean(selectedProcessId || selectedActorId || selectedActivityId || selectedResourceId)
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEffect(() => {
    if (hasSelection) setDrawerOpen(true)
  }, [hasSelection, selectedProcessId, selectedActorId, selectedActivityId, selectedResourceId])

  const renderContent = () => {
    if (process && selectedActivityId) {
      const diagram = process.diagrams.find((item) => item.nodes.some((node) => node.id === selectedActivityId))
      const node = diagram?.nodes.find((item) => item.id === selectedActivityId) ?? null
      if (diagram && node)
        return (
          <ActivityPanel
            process={process}
            diagram={diagram}
            node={node}
            catalog={catalog}
            onSelectNode={onSelectActivity}
            onClose={onClear}
          />
        )
    }
    if (selectedActorId) return <AreaDetails areaId={selectedActorId} catalog={catalog} model={model} onClear={onClear} />
    if (selectedResourceId) {
      const found = (
        [
          ['Sistema', catalog.systems],
          ['Canal', catalog.channels],
          ['Artefato', catalog.artifacts],
        ] as const
      )
        .map(([kind, items]) => ({ kind, item: items.find((item) => item.id === selectedResourceId) }))
        .find((result) => result.item)
      if (found?.item) return <ResourceDetails item={found.item} kind={found.kind} catalog={catalog} onClear={onClear} />
    }
    if (selectedProcessId) return <ProcessDetails processId={selectedProcessId} catalog={catalog} model={model} onClear={onClear} />
    return (
      <aside className="context-panel empty-panel twin-context-panel">
        <div className="empty-panel-icon">⌕</div>
        <span className="eyebrow">Mapa operacional</span>
        <h2>Explore as áreas e rotas</h2>
        <p>Selecione uma área, processo, atividade ou recurso para consultar fontes e sinais de incerteza.</p>
        <div className="panel-hint">A estrutura é conceitual: não representa geografia, telemetria ou responsabilidades confirmadas.</div>
      </aside>
    )
  }

  return (
    <div className={`twin-panel-wrapper ${hasSelection ? 'has-selection' : ''} ${drawerOpen ? 'is-drawer-open' : ''}`}>
      {hasSelection && (
        <button className="mobile-drawer-toggle" onClick={() => setDrawerOpen(!drawerOpen)}>
          {drawerOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      )}
      {renderContent()}
    </div>
  )
}
