import { classifyReadiness, type DataConfidenceState } from './readiness'
import type {
  DiagramLane,
  FrontendCatalog,
  PopStep,
  ProcessDiagram,
  ProcessFlow,
  ProcessNode,
  ProcessPayload,
  ReviewConflict,
  SourceReference,
} from './types'

export function allProcessNodes(process: ProcessPayload): ProcessNode[] {
  return process.diagrams.flatMap((diagram) => diagram.nodes)
}

export function nodeReconciliations(process: ProcessPayload, nodeId: string) {
  return process.reconciliations.filter((reconciliation) => reconciliation.bizagiNodeIds.includes(nodeId))
}

export function nodePopSteps(process: ProcessPayload, nodeId: string): PopStep[] {
  const ids = new Set(nodeReconciliations(process, nodeId).flatMap((reconciliation) => reconciliation.popStepIds))
  return process.popSteps.filter((step) => ids.has(step.id))
}

export function laneForNode(diagram: ProcessDiagram, node: ProcessNode): DiagramLane | undefined {
  const laneId = node.laneAssignment?.laneId
  return diagram.lanes.find((lane) => lane.id === laneId)
}

export function actorName(catalog: FrontendCatalog, actorId?: string | null): string | undefined {
  if (!actorId) return undefined
  return catalog.actors.find((actor) => actor.id === actorId)?.name
}

export function namedItems(catalog: FrontendCatalog, ids: string[], kind: 'systems' | 'channels' | 'artifacts') {
  const collection = catalog[kind]
  return collection.filter((item) => ids.includes(item.id))
}

export function conflictsForNode(catalog: FrontendCatalog, nodeId: string): ReviewConflict[] {
  return sourceConflictsForNode(catalog, nodeId).filter((conflict) => conflict.status !== 'resolved-human-review')
}

export function sourceConflictsForNode(catalog: FrontendCatalog, nodeId: string): ReviewConflict[] {
  return (catalog.conflicts as ReviewConflict[]).filter((conflict) => conflict.entityIds.includes(nodeId))
}

export function readinessForNode(process: ProcessPayload, node: ProcessNode, conflicts: ReviewConflict[]): DataConfidenceState {
  const unresolvedSubflow = process.subprocessReferences.some(
    (reference) => reference.sourceNodeId === node.id && reference.resolutionStatus === 'unresolved',
  )
  return classifyReadiness({
    assignmentMethod: node.laneAssignment?.assignmentMethod as 'explicit' | 'geometry' | 'unresolved' | undefined,
    assignmentClassification: node.laneAssignment?.classification as 'confirmed' | 'inferred' | 'unknown' | undefined,
    reconciliationStatus: node.reconciliationStatus as
      | 'matched'
      | 'partially-matched'
      | 'ambiguous'
      | 'unmatched-bizagi'
      | 'unmatched-pop'
      | undefined,
    subprocessResolution: unresolvedSubflow ? 'unresolved' : undefined,
    hasSourceConflict: conflicts.length > 0,
  })
}

export function sourceSummary(source: SourceReference): string {
  const parts = [source.kind.toUpperCase(), source.file]
  if (source.diagramId) parts.push(`diagrama ${source.diagramId}`)
  if (source.elementId) parts.push(`elemento ${source.elementId}`)
  if (source.table !== undefined) parts.push(`tabela ${source.table}`)
  if (source.row !== undefined) parts.push(`linha ${source.row}`)
  return parts.join(' · ')
}

export function flowLabel(flow: ProcessFlow): string | undefined {
  if (flow.label?.trim()) return flow.label.trim()
  if (flow.name?.trim()) return flow.name.trim()
  const condition = flow.condition
  if (condition && typeof condition === 'object' && 'text' in condition && typeof condition.text === 'string') {
    return condition.text.trim() || undefined
  }
  return undefined
}

export function sourceProcessIds(sources: SourceReference[]): string[] {
  const ids = new Set<string>()
  for (const source of sources) {
    const match = source.file.match(/(?:POP-|bpm[\\/])0*(\d{1,4})/i)
    if (match) ids.add(`P${match[1].padStart(3, '0')}`)
  }
  return [...ids].sort()
}

export function processDiagramGraph(diagram: ProcessDiagram) {
  return {
    nodes: diagram.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      incoming: node.incoming,
      outgoing: node.outgoing,
    })),
    flows: diagram.flows.map((flow) => ({
      id: flow.id,
      sourceNodeId: flow.sourceNodeId,
      targetNodeId: flow.targetNodeId,
      label: flowLabel(flow),
      name: flow.name,
    })),
  }
}

export function nodeTypeLabel(node: ProcessNode): string {
  switch (node.type) {
    case 'task':
      return 'Atividade'
    case 'gateway':
      return 'Decisão'
    case 'subprocess':
      return 'Subprocesso'
    case 'startEvent':
      return 'Início'
    case 'endEvent':
      return 'Fim'
    case 'intermediateEvent':
      return 'Evento'
    default:
      return node.type
  }
}

export function nodeDisplayName(node: ProcessNode): string {
  return node.name.trim() || node.originalId || node.id
}
