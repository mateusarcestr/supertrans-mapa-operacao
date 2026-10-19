import { describe, expect, it } from 'vitest'

import { buildTwinModel } from './twin'
import type { FrontendCatalog, Handoff } from './types'

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
})
