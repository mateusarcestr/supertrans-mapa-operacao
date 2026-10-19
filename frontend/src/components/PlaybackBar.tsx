import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipBack } from 'lucide-react'

import type { BranchOption, PlaybackState } from '../data/playback'
import { Button } from './orion/ui'

interface PlaybackBarProps {
  state: PlaybackState
  currentName: string
  pathNames: string[]
  nodeNames: ReadonlyMap<string, string>
  handoffCount: number
  onFirst: () => void
  onPrevious: () => void
  onTogglePlay: () => void
  onNext: () => void
  onReset: () => void
  onChooseBranch: (flowId: string) => void
}

export function PlaybackBar({
  state,
  currentName,
  pathNames,
  nodeNames,
  handoffCount,
  onFirst,
  onPrevious,
  onTogglePlay,
  onNext,
  onReset,
  onChooseBranch,
}: PlaybackBarProps) {
  const recentStartIndex = Math.max(0, pathNames.length - 5)
  const recentPath = pathNames.slice(recentStartIndex)

  return (
    <section className="playback-bar" aria-label="Playback do processo">
      <div className="playback-main">
        <div className="playback-title">
          <span className="eyebrow">Playback · etapa atual</span>
          <strong>{currentName || 'Aguardando início'}</strong>
          <span className="muted">
            {state.visitedNodeIds.length} {state.visitedNodeIds.length === 1 ? 'elemento percorrido' : 'elementos percorridos'} ·{' '}
            {handoffCount} {handoffCount === 1 ? 'handoff mapeado' : 'handoffs mapeados'}
          </span>
        </div>
        <div className="playback-tools">
          <div className="playback-state-legend" aria-label="Legenda do playback">
            <span className="playback-visited">✓ Percorrido</span>
            <span className="playback-current">● Atual</span>
            <span className="playback-future">○ Futuro possível</span>
          </div>
          <div className="playback-controls">
            <Button
              className="playback-button"
              variant="outline"
              size="icon"
              aria-label="Ir ao início"
              title="Ir ao início"
              onClick={onFirst}
            >
              <SkipBack aria-hidden="true" />
            </Button>
            <Button
              className="playback-button"
              variant="outline"
              size="icon"
              aria-label="Anterior"
              title="Anterior"
              disabled={state.visitedNodeIds.length <= 1}
              onClick={onPrevious}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              className="playback-button playback-primary"
              aria-label={state.isPlaying ? 'Pausar' : 'Reproduzir'}
              title={state.isPlaying ? 'Pausar' : 'Reproduzir'}
              onClick={onTogglePlay}
            >
              {state.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </Button>
            <Button
              className="playback-button"
              variant="outline"
              size="icon"
              aria-label="Próximo"
              title="Próximo"
              disabled={Boolean(state.pendingBranchNodeId)}
              onClick={onNext}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
            <Button className="playback-button" variant="outline" size="icon" aria-label="Reiniciar" title="Reiniciar" onClick={onReset}>
              <RotateCcw aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      {pathNames.length > 5 && (
        <details className="playback-history">
          <summary>Ver percurso completo · {pathNames.length} etapas</summary>
          <div className="playback-path playback-path-history" aria-label="Percurso completo">
            <PathSteps names={pathNames} currentIndex={pathNames.length - 1} />
          </div>
        </details>
      )}
      <div className="playback-path" aria-label="Etapas recentes do playback">
        {recentPath.length ? (
          <PathSteps names={recentPath} startIndex={recentStartIndex} currentIndex={pathNames.length - 1} />
        ) : (
          <span className="muted">Use Próximo ou Play para percorrer o fluxo.</span>
        )}
      </div>
      {state.pendingBranchNodeId && <BranchChooser options={state.branchOptions} nodeNames={nodeNames} onChoose={onChooseBranch} />}
    </section>
  )
}

function PathSteps({ names, startIndex = 0, currentIndex }: { names: string[]; startIndex?: number; currentIndex: number }) {
  return (
    <>
      {names.map((name, offset) => {
        const index = startIndex + offset
        const current = index === currentIndex
        return (
          <span
            key={`${name}-${index}`}
            title={name}
            aria-current={current ? 'step' : undefined}
            className={`path-step ${current ? 'is-current' : ''}`}
          >
            <i>{index + 1}</i>
            <span>{name}</span>
          </span>
        )
      })}
    </>
  )
}

function BranchChooser({
  options,
  nodeNames,
  onChoose,
}: {
  options: BranchOption[]
  nodeNames: ReadonlyMap<string, string>
  onChoose: (flowId: string) => void
}) {
  return (
    <div className="branch-chooser" role="group" aria-label="Escolha obrigatória de caminho">
      <div className="branch-chooser-heading">
        <span className="eyebrow">Decisão do fluxo</span>
        <strong>Como o processo continua?</strong>
        <span className="muted">Selecione a saída que representa o caminho real para avançar.</span>
      </div>
      <div className="branch-options">
        {options.map((option) => (
          <button key={option.flowId} onClick={() => onChoose(option.flowId)}>
            <span className="branch-option-label">{option.label}</span>
            <span className="branch-option-next">
              <small>Próxima etapa</small>
              <strong>{nodeNames.get(option.targetNodeId) || 'Destino não identificado no diagrama'}</strong>
            </span>
            <span className="branch-option-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
