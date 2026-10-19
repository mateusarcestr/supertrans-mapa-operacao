import type { DataConfidenceState } from './readiness'
import type { Handoff, ProcessPayload } from './types'

const confidencePrecedence: DataConfidenceState[] = [
  'READY_WITH_SOURCE_CONFLICT',
  'NEEDS_HUMAN_REVIEW',
  'READY_WITH_INFERENCE_BADGE',
  'READY',
]

export function aggregateConfidence(states: DataConfidenceState[]): DataConfidenceState {
  for (const state of confidencePrecedence) {
    if (states.includes(state)) return state
  }
  return 'NOT_AVAILABLE'
}

export function processSummaryConfidence(summary: {
  conflictCount: number
  unresolvedSubflowCount: number
  reconciliation: Record<string, number>
}): DataConfidenceState {
  if (summary.conflictCount > 0) return 'READY_WITH_SOURCE_CONFLICT'
  if (
    summary.unresolvedSubflowCount > 0 ||
    (summary.reconciliation.ambiguous ?? 0) > 0 ||
    (summary.reconciliation['partially-matched'] ?? 0) > 0
  ) {
    return 'NEEDS_HUMAN_REVIEW'
  }
  return 'READY'
}

export function catalogItemConfidence(item: { sources: unknown[] }): DataConfidenceState {
  return item.sources.length > 0 ? 'READY' : 'NOT_AVAILABLE'
}

export function centeredScrollOffset({
  targetStart,
  targetSize,
  scale,
  viewportSize,
  contentSize,
}: {
  targetStart: number
  targetSize: number
  scale: number
  viewportSize: number
  contentSize: number
}): number {
  const centered = (targetStart + targetSize / 2) * scale - viewportSize / 2
  return Math.max(0, Math.min(centered, Math.max(contentSize - viewportSize, 0)))
}

export function handoffConfidence(handoff: Handoff): DataConfidenceState {
  return handoff.classification === 'inferred' ? 'READY_WITH_INFERENCE_BADGE' : 'NEEDS_HUMAN_REVIEW'
}

export function splitHandoffActivityNames(name: string): { source: string; destination: string | null } {
  const separator = ' → '
  const separatorIndex = name.indexOf(separator)
  if (separatorIndex < 0) return { source: name.trim(), destination: null }
  return {
    source: name.slice(0, separatorIndex).trim(),
    destination: name.slice(separatorIndex + separator.length).trim(),
  }
}

export function handoffInferenceSummary(total: number, visible: number): string {
  const statement = `${total} passagens mapeadas · todas derivadas de atribuições inferidas`
  return visible === total ? statement : `${statement} · exibindo ${visible} com os filtros atuais`
}

export interface HandoffFilters {
  processId?: string
  fromActorId?: string
  toActorId?: string
  confidence?: DataConfidenceState
  query?: string
}

export function filterHandoffs(handoffs: Handoff[], filters: HandoffFilters): Handoff[] {
  const query = filters.query?.trim().toLocaleLowerCase('pt-BR')
  return handoffs.filter((handoff) => {
    if (filters.processId && handoff.processId !== filters.processId) return false
    if (filters.fromActorId && handoff.fromActorId !== filters.fromActorId) return false
    if (filters.toActorId && handoff.toActorId !== filters.toActorId) return false
    if (filters.confidence && handoffConfidence(handoff) !== filters.confidence) return false
    return !query || `${handoff.processId} ${handoff.name}`.toLocaleLowerCase('pt-BR').includes(query)
  })
}

export function buildHandoffMatrix(handoffs: Handoff[], actorIds: string[]) {
  const counts: Record<string, number> = {}
  for (const handoff of handoffs) {
    const key = `${handoff.fromActorId}->${handoff.toActorId}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return { actorIds: [...actorIds], counts }
}

export type RelationshipView = 'network' | 'matrix'

export function normalizeRelationshipView(value: string | null | undefined): RelationshipView {
  return value === 'matrix' ? 'matrix' : 'network'
}

export type ProcessRequestResolution =
  | { status: 'process-not-found' }
  | { status: 'loading' }
  | { status: 'activity-not-found'; diagramId: string }
  | { status: 'ready'; diagramId: string; nodeId?: string }

export function resolveProcessRequest(
  processIds: string[],
  processId: string,
  process: ProcessPayload | null,
  activityId: string | null,
): ProcessRequestResolution {
  if (!processIds.includes(processId)) return { status: 'process-not-found' }
  if (!process) return { status: 'loading' }
  const firstDiagramId = process.diagrams[0]?.id ?? ''
  if (!activityId) return { status: 'ready', diagramId: firstDiagramId }
  const targetDiagram = process.diagrams.find((diagram) => diagram.nodes.some((node) => node.id === activityId))
  if (!targetDiagram) return { status: 'activity-not-found', diagramId: firstDiagramId }
  return { status: 'ready', diagramId: targetDiagram.id, nodeId: activityId }
}
