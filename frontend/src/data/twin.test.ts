import { describe, expect, it } from 'vitest'

import { buildTwinActivityMarkers, buildTwinModel, filterTwinRoutes, TWIN_DEFAULT_LAYERS } from './twin'
import type { FrontendCatalog, Handoff, ProcessPayload } from './types'

const handoffs: Handoff[] = [
  {
    id: 'h-1',
    processId: 'P001',
    name: 'Comercial para Operação',
    fromActorId: 'actor:comercial',
    toActorId: 'actor:operacao',
    sourceNodeId: 'node:1',
    targetNodeId: 'node:2',
    flowId: 'flow:1',
    classification: 'inferred',
    sources: [],
  },
  {
    id: 'h-2',
    processId: 'P002',
    name: 'Cliente para Comercial',
    fromActorId: 'actor:cliente',
    toActorId: 'actor:comercial',
    sourceNodeId: 'node:3',
    targetNodeId: 'node:4',
    flowId: 'flow:2',
    classification: 'inferred',
    sources: [],
  },
]

const catalog = {
  processes: [
    { id: 'P001', name: 'Importação', nodeCount: 10, handoffCount: 1, conflictCount: 0 },
    { id: 'P002', name: 'Cabotagem', nodeCount: 8, handoffCount: 1, conflictCount: 2 },
  ],
  actors: [
    { id: 'actor:comercial', name: 'Comercial', classification: 'internal', sources: [] },
    { id: 'actor:operacao', name: 'Operação', classification: 'internal', sources: [] },
    { id: 'actor:cliente', name: 'Cliente', classification: 'external', sources: [] },
  ],
  systems: [],
  channels: [],
  artifacts: [],
  handoffs,
  conflicts: [],
} as unknown as FrontendCatalog

describe('operational twin projection', () => {
  it('assigns deterministic conceptual positions and keeps external areas farther from the core', () => {
    const first = buildTwinModel(catalog)
    const second = buildTwinModel(catalog)
    const internal = first.areas.find((area) => area.actorId === 'actor:comercial')!
    const external = first.areas.find((area) => area.actorId === 'actor:cliente')!

    expect(first.areas.map((area) => [area.actorId, area.position])).toEqual(second.areas.map((area) => [area.actorId, area.position]))
    expect(external.radius).toBeGreaterThan(internal.radius)
  })

  it('turns documented handoffs into process routes without adding links', () => {
    const twin = buildTwinModel(catalog)

    expect(twin.routes).toHaveLength(2)
    expect(twin.routes.map((route) => route.handoffIds)).toEqual([['h-1'], ['h-2']])
    expect(twin.routes.map((route) => route.flowIds)).toEqual([['flow:1'], ['flow:2']])
    expect(twin.routes.map((route) => route.processId)).toEqual(['P001', 'P002'])
  })

  it('keeps process routes independent from the handoff-marker layer', () => {
    const twin = buildTwinModel(catalog)

    expect(filterTwinRoutes(twin.routes, TWIN_DEFAULT_LAYERS, 'P001')).toHaveLength(1)
    expect(filterTwinRoutes(twin.routes, { ...TWIN_DEFAULT_LAYERS, processes: false }, undefined)).toEqual([])
    expect(filterTwinRoutes(twin.routes, { ...TWIN_DEFAULT_LAYERS, handoffs: false }, undefined)).toHaveLength(2)
  })

  it('derives activity markers deterministically and preserves conflict and unresolved readiness', () => {
    const process: ProcessPayload = {
      id: 'P001',
      name: 'Importação',
      sources: [],
      documentation: {},
      lifecycle: {},
      popSteps: [],
      reconciliations: [],
      subprocessReferences: [
        {
          id: 'subflow:1',
          name: 'Sem alvo',
          processId: 'P001',
          diagramId: 'diagram:1',
          sourceNodeId: 'node:subflow',
          resolutionStatus: 'unresolved',
          sources: [],
        },
      ],
      diagrams: [
        {
          id: 'diagram:1',
          name: 'Fluxo',
          sources: [],
          flows: [],
          lanes: [{ id: 'lane:comercial', name: 'Comercial', actorId: 'actor:comercial' }],
          nodes: [
            {
              id: 'node:conflict',
              name: 'Atividade em conflito',
              type: 'task',
              incoming: [],
              outgoing: [],
              diagramId: 'diagram:1',
              reconciliationStatus: 'matched',
              laneAssignment: { laneId: 'lane:comercial', assignmentMethod: 'geometry', classification: 'inferred' },
              sources: [],
            },
            {
              id: 'node:subflow',
              name: 'Subprocesso sem alvo',
              type: 'subprocess',
              incoming: [],
              outgoing: [],
              diagramId: 'diagram:1',
              sources: [],
            },
          ],
        },
      ],
    }
    const catalogWithConflict = {
      ...catalog,
      conflicts: [
        { id: 'conflict:1', processId: 'P001', field: 'responsibility', status: 'needs-review', entityIds: ['node:conflict'], sources: [] },
      ],
    } as unknown as FrontendCatalog
    const twin = buildTwinModel(catalogWithConflict)
    const first = buildTwinActivityMarkers(catalogWithConflict, process, twin.areas)
    const second = buildTwinActivityMarkers(catalogWithConflict, process, twin.areas)

    expect(first).toEqual(second)
    expect(first.find((marker) => marker.id === 'node:conflict')?.readiness).toBe('READY_WITH_SOURCE_CONFLICT')
    expect(first.find((marker) => marker.id === 'node:subflow')).toMatchObject({ unresolved: true, readiness: 'NOT_AVAILABLE' })
  })
})
