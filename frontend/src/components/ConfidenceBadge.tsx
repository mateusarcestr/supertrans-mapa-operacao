import { readinessCopy, type DataConfidenceState } from '../data/readiness'
import { CircleCheck, Diamond, TriangleAlert, CircleHelp, CircleMinus } from 'lucide-react'

const symbols = {
  READY: CircleCheck,
  READY_WITH_INFERENCE_BADGE: Diamond,
  READY_WITH_SOURCE_CONFLICT: TriangleAlert,
  NEEDS_HUMAN_REVIEW: CircleHelp,
  NOT_AVAILABLE: CircleMinus,
}

export function ConfidenceBadge({ state, compact = false }: { state: DataConfidenceState; compact?: boolean }) {
  const copy = readinessCopy[state]
  const Icon = symbols[state]
  return (
    <span className={`confidence confidence-${state.toLowerCase()}`} title={copy.detail} aria-label={`${copy.label}: ${copy.detail}`}>
      <Icon aria-hidden="true" size={13} />
      {!compact && <span>{copy.label}</span>}
    </span>
  )
}
