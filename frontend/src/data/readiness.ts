export const dataConfidenceStates = [
  'READY',
  'READY_WITH_INFERENCE_BADGE',
  'READY_WITH_SOURCE_CONFLICT',
  'NEEDS_HUMAN_REVIEW',
  'NOT_AVAILABLE',
] as const

export type DataConfidenceState = (typeof dataConfidenceStates)[number]

export interface ReadinessEvidence {
  assignmentMethod?: 'explicit' | 'geometry' | 'unresolved'
  assignmentClassification?: 'confirmed' | 'inferred' | 'unknown'
  reconciliationStatus?:
    | 'matched'
    | 'partially-matched'
    | 'ambiguous'
    | 'unmatched-bizagi'
    | 'unmatched-pop'
  subprocessResolution?: 'resolved' | 'unresolved'
  hasSourceConflict?: boolean
}

/**
 * Maps existing model evidence to presentation states without promoting it.
 * Conflict and unavailable data take priority because visual confidence must
 * never hide a more serious qualifier.
 */
export function classifyReadiness(evidence: ReadinessEvidence): DataConfidenceState {
  if (evidence.hasSourceConflict) return 'READY_WITH_SOURCE_CONFLICT'
  if (evidence.subprocessResolution === 'unresolved') return 'NOT_AVAILABLE'
  if (
    evidence.reconciliationStatus === 'partially-matched' ||
    evidence.reconciliationStatus === 'ambiguous' ||
    evidence.reconciliationStatus === 'unmatched-pop'
  ) {
    return 'NEEDS_HUMAN_REVIEW'
  }
  if (
    evidence.assignmentMethod === 'geometry' ||
    evidence.assignmentClassification === 'inferred' ||
    evidence.reconciliationStatus === 'unmatched-bizagi'
  ) {
    return 'READY_WITH_INFERENCE_BADGE'
  }
  return 'READY'
}

export const readinessCopy: Record<DataConfidenceState, { label: string; detail: string }> = {
  READY: {
    label: 'Confirmado',
    detail: 'Dado disponível sem qualificador de incerteza no modelo de apresentação.',
  },
  READY_WITH_INFERENCE_BADGE: {
    label: 'Inferido',
    detail: 'A evidência foi inferida a partir do modelo e ainda não recebeu validação humana.',
  },
  READY_WITH_SOURCE_CONFLICT: {
    label: 'Conflito',
    detail: 'Bizagi e POP apresentam informação divergente. Consulte as evidências.',
  },
  NEEDS_HUMAN_REVIEW: {
    label: 'Precisa validação',
    detail: 'A correspondência permanece parcial, ambígua ou sem vínculo confirmado.',
  },
  NOT_AVAILABLE: {
    label: 'Não determinado',
    detail: 'A fonte não determina esse valor. A interface não deve inventá-lo.',
  },
}
