import { conflictsForNode, laneForNode, readinessForNode, sourceProcessIds } from './model'
import type { DataConfidenceState } from './readiness'
import type { FrontendCatalog, Handoff, NamedCatalogItem, ProcessPayload } from './types'

export type TwinLayerKey = 'areas' | 'processes' | 'activities' | 'systems' | 'decisions' | 'handoffs'
export type TwinLayers = Record<TwinLayerKey, boolean>
export type TwinPosition = [number, number, number]

export const TWIN_DEFAULT_LAYERS: TwinLayers = {
  areas: true,
  processes: true,
  activities: false,
  systems: false,
  decisions: false,
  handoffs: true,
}

const PROCESS_COLORS = ['#4aa9a2', '#5c93b1', '#7c8fa9', '#a18a72', '#6c9a83', '#846fa5', '#51949a', '#9c806b', '#718aaf', '#5e9b91']

export interface TwinArea {
  actorId: string
  name: string
  classification: 'internal' | 'external' | 'unknown'
  position: TwinPosition
  radius: number
  height: number
  processIds: string[]
  handoffCount: number
  confidence: DataConfidenceState
  sources: NamedCatalogItem['sources']
}

export interface TwinRoute {
  id: string
  processId: string
  processName: string
  color: string
  fromActorId: string
  toActorId: string
  handoffIds: string[]
  flowIds: string[]
  sourceNodeId: string
  targetNodeId: string
  confidence: DataConfidenceState
  classification: string
}

export interface TwinResource {
  id: string
  kind: 'system' | 'channel' | 'artifact'
  name: string
  processIds: string[]
  anchorActorId?: string
  position: TwinPosition
  sources: NamedCatalogItem['sources']
}

export interface OperationalTwinModel {
  areas: TwinArea[]
  routes: TwinRoute[]
  resources: TwinResource[]
}

export interface TwinActivityMarker {
  id: string
  name: string
  type: string
  actorId?: string
  position: TwinPosition
  readiness: DataConfidenceState
  unresolved: boolean
}

function normalizeClassification(value: string | undefined): TwinArea['classification'] {
  return value === 'internal' || value === 'external' ? value : 'unknown'
}

function circlePosition(index: number, total: number, radius: number, offset = 0): TwinPosition {
  const angle = -Math.PI / 2 + offset + (Math.PI * 2 * index) / Math.max(total, 1)
  return [Number((Math.cos(angle) * radius).toFixed(3)), 0, Number((Math.sin(angle) * radius).toFixed(3))]
}

function processColor(processId: string, processIds: string[]): string {
  const index = Math.max(processIds.indexOf(processId), 0)
  return PROCESS_COLORS[index % PROCESS_COLORS.length]
}

function stableUnit(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function handoffConfidence(handoff: Handoff): DataConfidenceState {
  return handoff.classification === 'inferred'
    ? 'READY_WITH_INFERENCE_BADGE'
    : 'NEEDS_HUMAN_REVIEW'
}

function groupHandoffs(handoffs: Handoff[]): Handoff[][] {
  const grouped = new Map<string, Handoff[]>()
  for (const handoff of handoffs) {
    const key = `${handoff.processId}|${handoff.fromActorId}|${handoff.toActorId}`
    const current = grouped.get(key) ?? []
    current.push(handoff)
    grouped.set(key, current)
  }
  return [...grouped.values()].sort((left, right) => {
    const a = left[0]
    const b = right[0]
    return `${a.processId}|${a.fromActorId}|${a.toActorId}`.localeCompare(`${b.processId}|${b.fromActorId}|${b.toActorId}`, 'pt-BR')
  })
}

function resourceAnchor(processIds: string[], routes: TwinRoute[]): string | undefined {
  const candidates = routes
    .filter((route) => processIds.includes(route.processId))
    .flatMap((route) => [route.fromActorId, route.toActorId])
    .sort()
  return candidates[0]
}

function buildResources(catalog: FrontendCatalog, routes: TwinRoute[], areas: TwinArea[]): TwinResource[] {
  const anchorPositions = new Map(areas.map((area) => [area.actorId, area.position]))
  const collections: Array<[TwinResource['kind'], NamedCatalogItem[]]> = [
    ['system', catalog.systems],
    ['channel', catalog.channels],
    ['artifact', catalog.artifacts],
  ]
  const resources = collections.flatMap(([kind, items]) => items.map((item) => ({ kind, item })))
  return resources
    .sort((left, right) => `${left.kind}|${left.item.name}`.localeCompare(`${right.kind}|${right.item.name}`, 'pt-BR'))
    .map(({ kind, item }, index) => {
      const processIds = sourceProcessIds(item.sources)
      const anchorActorId = resourceAnchor(processIds, routes)
      const anchor = anchorActorId ? anchorPositions.get(anchorActorId) : undefined
      const offset = circlePosition(index, Math.max(resources.length, 1), 1.1, Math.PI / 6)
      return {
        id: item.id,
        kind,
        name: item.name,
        processIds,
        anchorActorId,
        position: anchor
          ? [Number((anchor[0] + offset[0]).toFixed(3)), 0.35, Number((anchor[2] + offset[2]).toFixed(3))]
          : [offset[0], 0.35, offset[2]],
        sources: item.sources,
      }
    })
}

export function buildTwinModel(catalog: FrontendCatalog): OperationalTwinModel {
  const handoffs = catalog.handoffs as Handoff[]
  const processIds = catalog.processes.map((process) => process.id).sort()
  const degrees = new Map<string, number>()
  const relatedProcesses = new Map<string, Set<string>>()
  for (const handoff of handoffs) {
    for (const actorId of [handoff.fromActorId, handoff.toActorId]) {
      degrees.set(actorId, (degrees.get(actorId) ?? 0) + 1)
      const current = relatedProcesses.get(actorId) ?? new Set<string>()
      current.add(handoff.processId)
      relatedProcesses.set(actorId, current)
    }
  }

  const groups: Record<TwinArea['classification'], NamedCatalogItem[]> = { internal: [], unknown: [], external: [] }
  for (const actor of catalog.actors) groups[normalizeClassification(actor.classification)].push(actor)

  const groupSettings: Array<[TwinArea['classification'], number, number]> = [
    ['internal', 3.4, 0],
    ['unknown', 5.8, Math.PI / 9],
    ['external', 8.2, Math.PI / 5],
  ]
  const areas = groupSettings.flatMap(([classification, radius, offset]) => groups[classification]
    .sort((left, right) => ((degrees.get(right.id) ?? 0) - (degrees.get(left.id) ?? 0)) || left.name.localeCompare(right.name, 'pt-BR'))
    .map((actor, index, group) => {
      const handoffCount = degrees.get(actor.id) ?? 0
      return {
        actorId: actor.id,
        name: actor.name,
        classification,
        position: circlePosition(index, group.length, radius, offset),
        radius,
        height: Number((0.5 + Math.min(0.75, handoffCount * 0.06)).toFixed(3)),
        processIds: [...(relatedProcesses.get(actor.id) ?? new Set<string>())].sort(),
        handoffCount,
        confidence: 'READY_WITH_INFERENCE_BADGE' as const,
        sources: actor.sources,
      }
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))

  const actorIds = new Set(areas.map((area) => area.actorId))
  const names = new Map(catalog.processes.map((process) => [process.id, process.name]))
  const routes: TwinRoute[] = groupHandoffs(handoffs)
    .filter((group) => actorIds.has(group[0].fromActorId) && actorIds.has(group[0].toActorId))
    .map((group) => {
      const first = group[0]
      return {
        id: `route:${first.processId}:${first.fromActorId}:${first.toActorId}`,
        processId: first.processId,
        processName: names.get(first.processId) ?? first.processId,
        color: processColor(first.processId, processIds),
        fromActorId: first.fromActorId,
        toActorId: first.toActorId,
        handoffIds: group.map((handoff) => handoff.id).sort(),
        flowIds: [...new Set(group.map((handoff) => handoff.flowId))].sort(),
        sourceNodeId: first.sourceNodeId,
        targetNodeId: first.targetNodeId,
        confidence: group.some((handoff) => handoffConfidence(handoff) === 'NEEDS_HUMAN_REVIEW')
          ? 'NEEDS_HUMAN_REVIEW' as const
          : 'READY_WITH_INFERENCE_BADGE' as const,
        classification: first.classification ?? 'inferred',
      }
    })

  return { areas, routes, resources: buildResources(catalog, routes, areas) }
}

export function filterTwinRoutes(routes: TwinRoute[], layers: TwinLayers, selectedProcessId?: string): TwinRoute[] {
  if (!layers.processes) return []
  return selectedProcessId ? routes.filter((route) => route.processId === selectedProcessId) : routes
}

export function buildTwinActivityMarkers(
  catalog: FrontendCatalog,
  process: ProcessPayload,
  areas: TwinArea[],
): TwinActivityMarker[] {
  const areaByActor = new Map(areas.map((area) => [area.actorId, area]))
  return process.diagrams.flatMap((diagram) => diagram.nodes.map((node) => {
    const lane = laneForNode(diagram, node)
    const area = lane?.actorId ? areaByActor.get(lane.actorId) : undefined
    const angle = stableUnit(node.id) * Math.PI * 2
    const distance = 0.3 + stableUnit(`${node.id}:distance`) * 0.85
    const conflicts = conflictsForNode(catalog, node.id)
    const unresolved = node.type === 'subprocess' && (
      node.subflowResolutionStatus === 'unresolved'
      || process.subprocessReferences.some((reference) => reference.sourceNodeId === node.id && reference.resolutionStatus === 'unresolved')
    )
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      actorId: lane?.actorId ?? undefined,
      position: area
        ? [
          Number((area.position[0] + Math.cos(angle) * distance).toFixed(3)),
          Number((area.height + 0.16).toFixed(3)),
          Number((area.position[2] + Math.sin(angle) * distance).toFixed(3)),
        ]
        : [Number((Math.cos(angle) * distance).toFixed(3)), 0.7, Number((Math.sin(angle) * distance).toFixed(3))],
      readiness: readinessForNode(process, node, conflicts),
      unresolved,
    }
  }))
}
