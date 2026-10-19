import { readinessCopy, type DataConfidenceState } from '../data/readiness'

const symbols: Record<DataConfidenceState, string> = {
  READY: '●',
  READY_WITH_INFERENCE_BADGE: '◇',
  READY_WITH_SOURCE_CONFLICT: '!',
  NEEDS_HUMAN_REVIEW: '?',
  NOT_AVAILABLE: '—',
}

export function ConfidenceBadge({ state, compact = false }: { state: DataConfidenceState; compact?: boolean }) {
  const copy = readinessCopy[state]
  return (
    <span className={`confidence confidence-${state.toLowerCase()}`} title={copy.detail} aria-label={`${copy.label}: ${copy.detail}`}>
      <span aria-hidden="true">{symbols[state]}</span>
      {!compact && <span>{copy.label}</span>}
    </span>
  )
}
