import type { DataConfidenceState } from './readiness'

export interface ProcessSummary {
  id: string
  name: string
  objective: string | null
  diagramCount: number
  nodeCount: number
  flowCount: number
  nodeTypes: Record<string, number>
  reconciliation: Record<string, number>
  unresolvedSubflowCount: number
  actorCount: number
  systemCount: number
  channelCount: number
  artifactCount: number
  handoffCount: number
  conflictCount: number
  sources: SourceReference[]
  readiness?: DataConfidenceState
}

export interface SourceReference {
  kind: 'bizagi' | 'pop' | 'jira' | 'portal'
  file: string
  member?: string
  archiveMember?: string
  diagramId?: string
  elementId?: string
  table?: number
  row?: number
  column?: number
}

export interface NamedCatalogItem {
  id: string
  name: string
  aliases?: string[]
  classification?: string
  sources: SourceReference[]
}

export interface FrontendCatalog {
  schemaVersion: string
  sourcePolicy: string[]
  summary: FrontendSummary
  processes: ProcessSummary[]
  activityIndex: ActivityIndexItem[]
  actors: NamedCatalogItem[]
  systems: NamedCatalogItem[]
  channels: NamedCatalogItem[]
  artifacts: NamedCatalogItem[]
  handoffs: unknown[]
  relationships: unknown[]
  conflicts: unknown[]
  diagnostics: unknown[]
}

export interface ActivityIndexItem {
  id: string
  processId: string
  diagramId: string
  name: string
  type: string
  reconciliationStatus?: string
  laneId?: string | null
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramLane {
  id: string
  name: string
  actorId?: string | null
  bounds?: Bounds
}

export interface ProcessNode {
  id: string
  name: string
  type: string
  originalId?: string
  bounds?: Bounds
  incoming: string[]
  outgoing: string[]
  diagramId: string
  reconciliationStatus?: string
  reconciliationId?: string
  eventKind?: string
  gatewayType?: string
  subflowResolutionStatus?: string | null
  laneAssignment?: {
    assignmentMethod?: string
    classification?: string
    laneId?: string | null
  }
  responsibility?: {
    actorId?: string | null
    status?: string
  }
  sources: SourceReference[]
  [key: string]: unknown
}

export interface ProcessFlow {
  id: string
  sourceNodeId: string
  targetNodeId: string
  name?: string
  label?: string | null
  originalId?: string
  sources: SourceReference[]
  [key: string]: unknown
}

export interface ProcessDiagram {
  id: string
  name: string
  originalId?: string
  sources: SourceReference[]
  lanes: DiagramLane[]
  nodes: ProcessNode[]
  flows: ProcessFlow[]
  [key: string]: unknown
}

export interface PopStep {
  id: string
  name: string
  description?: string
  executorText?: string
  executorActorId?: string
  systemIds: string[]
  channelIds: string[]
  artifactIds: string[]
  reconciliationStatus?: string
  sources: SourceReference[]
  [key: string]: unknown
}

export interface Reconciliation {
  id: string
  name: string
  processId: string
  status: string
  classification?: string
  confidence?: string
  evidence?: string[]
  bizagiNodeIds: string[]
  popStepIds: string[]
  sources: SourceReference[]
  [key: string]: unknown
}

export interface SubprocessReference {
  id: string
  name: string
  processId: string
  diagramId: string
  sourceNodeId: string
  targetOriginalId?: string | null
  resolutionStatus: string
  sources: SourceReference[]
}

export interface ProcessPayload {
  id: string
  name: string
  sources: SourceReference[]
  documentation: Record<string, unknown>
  lifecycle: Record<string, unknown>
  diagrams: ProcessDiagram[]
  popSteps: PopStep[]
  reconciliations: Reconciliation[]
  subprocessReferences: SubprocessReference[]
}

export interface ReviewConflict {
  id: string
  processId: string
  field: string
  bizagiValue?: string
  popValue?: string
  status: string
  entityIds: string[]
  sources: SourceReference[]
}

export interface Handoff {
  id: string
  processId: string
  name: string
  fromActorId: string
  toActorId: string
  sourceNodeId: string
  targetNodeId: string
  flowId: string
  classification?: string
  evidence?: string[]
  sources: SourceReference[]
}

export interface FrontendSummary {
  processes: number
  diagrams: number
  nodes: number
  flows: number
  conflicts: number
  unresolvedSubflows: number
  [key: string]: number | Record<string, number>
}
