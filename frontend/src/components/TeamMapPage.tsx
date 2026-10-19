import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowRight, Network, Users, X } from 'lucide-react'
import { PageHeader } from './orion/blocks'
import { EvidenceList } from './EvidenceList'
import { ConfidenceBadge } from './ConfidenceBadge'
import { buildTeamMap } from '../data/team-map'
import { actorName } from '../data/model'
import { groupHandoffsForReading } from '../data/handoff-reading'
import { handoffConfidence, splitHandoffActivityNames } from '../data/presentation'
import type { FrontendCatalog, Handoff } from '../data/types'

export function TeamMapPage({ catalog }: { catalog: FrontendCatalog }) {
  const [params, setParams] = useSearchParams()
  const [selection, setSelection] = useState<{ key: string; ids: string[] } | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const requestedProcess = params.get('process')
  const all = catalog.handoffs as Handoff[]
  const activity = params.get('activity')
  const requestedActor = params.get('area')
  const contextProcess = all.find((item) =>
    activity
      ? [item.sourceNodeId, item.targetNodeId].includes(activity)
      : requestedActor
        ? [item.fromActorId, item.toActorId].includes(requestedActor)
        : false,
  )?.processId
  const process =
    catalog.processes.find((item) => item.id === requestedProcess) ??
    catalog.processes.find((item) => item.id === contextProcess) ??
    catalog.processes[0]
  const matchingActivity = all.find(
    (item) => item.processId === process?.id && [item.sourceNodeId, item.targetNodeId].includes(activity ?? ''),
  )
  const model = useMemo(
    () => buildTeamMap(all, process?.id ?? '', params.get('area') ?? matchingActivity?.fromActorId),
    [all, process?.id, params, matchingActivity],
  )
  const contextKey = `${process?.id}|${model.focusActorId}`
  const focused = model.handoffs.filter((item) => item.fromActorId === model.focusActorId || item.toActorId === model.focusActorId)
  const detailsOpen = selection?.key === contextKey
  const visible = detailsOpen ? focused.filter((item) => selection.ids.includes(item.id)) : []
  const ordered = groupHandoffsForReading(visible).flatMap((group) => group.items)
  useEffect(() => {
    const dialog = dialogRef.current
    if (detailsOpen && !dialog?.open) dialog?.showModal()
    else if (!detailsOpen && dialog?.open) dialog.close()
  }, [detailsOpen])
  const name = (id?: string) => (id ? (actorName(catalog, id) ?? 'Participante não identificado') : 'Nenhuma equipe mapeada')
  const change = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    next.set('view', 'map')
    Object.entries(values).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setParams(next, { replace: true })
    setSelection(null)
  }
  const neighbors = (direction: 'incoming' | 'outgoing') => (
    <div className={`team-map-neighbors ${direction}`}>
      <h3>{direction === 'incoming' ? 'Entregam para esta equipe' : 'Recebem desta equipe'}</h3>
      {model[direction].map((neighbor) => (
        <button
          key={neighbor.actorId}
          className={`team-map-node ${selection?.key === contextKey && selection.ids[0] === neighbor.handoffs[0]?.id ? 'is-selected' : ''}`}
          onClick={() => setSelection({ key: contextKey, ids: neighbor.handoffs.map((item) => item.id) })}
        >
          <span className="team-map-node-icon">
            <Users size={20} aria-hidden="true" />
          </span>
          <strong>{name(neighbor.actorId)}</strong>
          <span className="team-map-link-count">
            {neighbor.handoffs.length} {neighbor.handoffs.length === 1 ? 'passagem' : 'passagens'}{' '}
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        </button>
      ))}
      {model[direction].length === 0 && <p className="team-map-empty">Nenhuma passagem documentada nesta direção.</p>}
    </div>
  )
  return (
    <div className="page-stack team-map-page">
      <PageHeader
        eyebrow="Rede de entregas"
        title="Mapa de equipes e passagens"
        description="Escolha um processo e uma equipe. Veja de quem ela recebe e para quem entrega; abra uma ligação para consultar atividades e evidências."
      />
      <div className="team-map-toolbar">
        <label className="field-control">
          <span>Processo</span>
          <select
            value={process?.id ?? ''}
            onChange={(event) => change({ process: event.target.value, area: undefined, activity: undefined, resource: undefined })}
          >
            {catalog.processes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <Link className="text-button" to={`/processos/${process?.id}`}>
          Ver fluxo Bizagi <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link className="text-button" to="/?view=matrix">
          Ver matriz de passagens
        </Link>
      </div>
      <div className="team-map-context">
        <span>
          <strong>{model.actorIds.length}</strong> participantes
        </span>
        <span>
          <strong>{model.handoffs.length}</strong> passagens neste processo
        </span>
        <span>Associações de participantes inferidas</span>
      </div>
      <nav className="team-map-teams" aria-label="Equipe em foco">
        {[...model.actorIds]
          .sort((a, b) => name(a).localeCompare(name(b), 'pt-BR'))
          .map((id) => (
            <button
              key={id}
              aria-pressed={id === model.focusActorId}
              onClick={() => change({ process: process?.id, area: id, activity: undefined })}
            >
              {name(id)}
            </button>
          ))}
      </nav>
      {model.focusActorId ? (
        <section className="team-map-network" aria-label={`Passagens de ${name(model.focusActorId)}`}>
          {neighbors('incoming')}
          <div className="team-map-connector">
            <ArrowRight aria-hidden="true" />
            <ArrowDown aria-hidden="true" />
          </div>
          <div className="team-map-focus">
            <span className="eyebrow">Equipe em foco</span>
            <Network size={32} aria-hidden="true" />
            <h2>{name(model.focusActorId)}</h2>
            <span>{focused.length} passagens associadas</span>
            <ConfidenceBadge state="READY_WITH_INFERENCE_BADGE" />
            <button className="text-button" onClick={() => setSelection({ key: contextKey, ids: focused.map((item) => item.id) })}>
              Ver passagens desta equipe
            </button>
            {model.internal.length > 0 && (
              <button className="text-button" onClick={() => setSelection({ key: contextKey, ids: model.internal.map((item) => item.id) })}>
                {model.internal.length} passagens internas
              </button>
            )}
          </div>
          <div className="team-map-connector">
            <ArrowRight aria-hidden="true" />
            <ArrowDown aria-hidden="true" />
          </div>
          {neighbors('outgoing')}
        </section>
      ) : (
        <p className="team-map-empty">Nenhuma passagem documentada para este processo.</p>
      )}
      <p className="team-map-note">
        Setas indicam entregas documentadas, não uma sequência única de execução. Participantes associados com base nos POP (Procedimentos
        Operacionais Padrão) continuam inferidos. A posição das equipes serve à leitura, sem representar localização física.
      </p>
      <dialog
        ref={dialogRef}
        className="team-map-drawer"
        aria-labelledby="team-map-details-title"
        onCancel={() => setSelection(null)}
        onClose={() => setSelection(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelection(null)
        }}
      >
        <section className="team-map-details">
          <header>
            <div>
              <span className="eyebrow">{process?.name} · detalhes</span>
              <h2 id="team-map-details-title">Passagens selecionadas</h2>
              <span>
                {ordered.length} {ordered.length === 1 ? 'entrega' : 'entregas'}
              </span>
            </div>
            <button className="icon-button" aria-label="Fechar passagens" onClick={() => setSelection(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          {ordered.map((item) => {
            const labels = splitHandoffActivityNames(item.name)
            return (
              <article className="team-map-delivery" key={item.id} data-handoff-id={item.id}>
                <header>
                  <strong>
                    {name(item.fromActorId)} <ArrowRight size={16} aria-hidden="true" /> {name(item.toActorId)}
                  </strong>
                  <ConfidenceBadge state={handoffConfidence(item)} />
                </header>
                <div className="handoff-card-activities">
                  <div>
                    <span className="handoff-field-label">Sai da atividade</span>
                    <Link to={`/processos/${item.processId}?activity=${encodeURIComponent(item.sourceNodeId)}`}>{labels.source}</Link>
                  </div>
                  <div>
                    <span className="handoff-field-label">Chega na atividade</span>
                    <Link to={`/processos/${item.processId}?activity=${encodeURIComponent(item.targetNodeId)}`}>
                      {labels.destination ?? 'Não identificada'}
                    </Link>
                  </div>
                </div>
                <details className="handoff-evidence">
                  <summary>Ver evidências</summary>
                  <EvidenceList sources={item.sources} showAll />
                </details>
              </article>
            )
          })}
          {ordered.length === 0 && <p className="team-map-empty">Nenhuma passagem associada à seleção.</p>}
        </section>
      </dialog>
    </div>
  )
}
