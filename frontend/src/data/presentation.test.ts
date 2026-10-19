import { describe, expect, it } from 'vitest'
import * as presentation from './presentation'

import {
  aggregateConfidence,
  buildHandoffMatrix,
  buildOverviewHref,
  catalogItemConfidence,
  centeredScrollOffset,
  filterHandoffs,
  normalizeRelationshipView,
  processSummaryConfidence,
  resolveProcessRequest,
  supportsWebGl,
} from './presentation'
import type { Handoff, ProcessPayload } from './types'

const handoffs: Handoff[] = [
  {
    id: 'h1', processId: 'P001', name: 'A para B', fromActorId: 'a', toActorId: 'b',
    sourceNodeId: 'n1', targetNodeId: 'n2', flowId: 'f1', classification: 'inferred',
    sources: [],
  },
  {
    id: 'h2', processId: 'P002', name: 'B para A', fromActorId: 'b', toActorId: 'a',
    sourceNodeId: 'n3', targetNodeId: 'n4', flowId: 'f2', classification: 'inferred',
    sources: [],
  },
]

describe('presentation contracts', () => {
  it('splits handoff activity labels and keeps long labels intact', () => {
    const split = (presentation as unknown as Record<string, unknown>).splitHandoffActivityNames
    expect(split).toBeTypeOf('function')
    if (typeof split !== 'function') return
    expect((split as (name: string) => unknown)('3. Recebe solicitação de importação do cliente → 4. Analisa capacidade de atendimento e janela operacional'))
      .toEqual({ source: '3. Recebe solicitação de importação do cliente', destination: '4. Analisa capacidade de atendimento e janela operacional' })
  })

  it('states that every mapped handoff comes from inferred assignments and keeps filter counts separate', () => {
    const summary = (presentation as unknown as Record<string, unknown>).handoffInferenceSummary
    expect(summary).toBeTypeOf('function')
    if (typeof summary !== 'function') return
    expect((summary as (total: number, visible: number) => string)(73, 73))
      .toBe('73 passagens mapeadas · todas derivadas de atribuições inferidas')
    expect((summary as (total: number, visible: number) => string)(73, 1))
      .toBe('73 passagens mapeadas · todas derivadas de atribuições inferidas · exibindo 1 com os filtros atuais')
  })

  it('uses conflict, review, inferred, ready precedence and treats unavailable as absence', () => {
    expect(aggregateConfidence(['READY', 'READY_WITH_INFERENCE_BADGE', 'NOT_AVAILABLE'])).toBe('READY_WITH_INFERENCE_BADGE')
    expect(aggregateConfidence(['NEEDS_HUMAN_REVIEW', 'READY_WITH_INFERENCE_BADGE'])).toBe('NEEDS_HUMAN_REVIEW')
    expect(aggregateConfidence(['READY_WITH_SOURCE_CONFLICT', 'NEEDS_HUMAN_REVIEW'])).toBe('READY_WITH_SOURCE_CONFLICT')
    expect(aggregateConfidence(['NOT_AVAILABLE'])).toBe('NOT_AVAILABLE')
  })

  it('keeps process conflicts above unresolved and partial reconciliation signals', () => {
    expect(processSummaryConfidence({ conflictCount: 2, unresolvedSubflowCount: 1, reconciliation: { 'partially-matched': 3 } })).toBe('READY_WITH_SOURCE_CONFLICT')
    expect(processSummaryConfidence({ conflictCount: 0, unresolvedSubflowCount: 1, reconciliation: {} })).toBe('NEEDS_HUMAN_REVIEW')
  })

  it('derives catalog item availability only from source references', () => {
    expect(catalogItemConfidence({ sources: [{ kind: 'pop', file: 'POP/item.docx' }] })).toBe('READY')
    expect(catalogItemConfidence({ sources: [] })).toBe('NOT_AVAILABLE')
  })

  it('centers a selected graph item without scrolling beyond its own viewport', () => {
    expect(centeredScrollOffset({ targetStart: 500, targetSize: 100, scale: 1, viewportSize: 400, contentSize: 1000 })).toBe(350)
    expect(centeredScrollOffset({ targetStart: 10, targetSize: 20, scale: 1, viewportSize: 400, contentSize: 1000 })).toBe(0)
    expect(centeredScrollOffset({ targetStart: 950, targetSize: 50, scale: 1, viewportSize: 400, contentSize: 1000 })).toBe(600)
  })

  it('filters handoffs by process, origin, destination and confidence without changing records', () => {
    expect(filterHandoffs(handoffs, { processId: 'P001' }).map((item) => item.id)).toEqual(['h1'])
    expect(filterHandoffs(handoffs, { fromActorId: 'b', toActorId: 'a', confidence: 'READY_WITH_INFERENCE_BADGE' }).map((item) => item.id)).toEqual(['h2'])
    expect(handoffs).toHaveLength(2)
  })

  it('builds a directional actor matrix with literal handoff counts', () => {
    const matrix = buildHandoffMatrix(handoffs, ['a', 'b'])
    expect(matrix.actorIds).toEqual(['a', 'b'])
    expect(matrix.counts).toEqual({ 'a->b': 1, 'b->a': 1 })
  })

  it('normalizes the areas and handoffs relationship view', () => {
    expect(normalizeRelationshipView('matrix')).toBe('matrix')
    expect(normalizeRelationshipView('unexpected')).toBe('network')
  })

  it('preserves process, actor and activity selection when switching overview mode', () => {
    expect(buildOverviewHref({ processId: 'P001', actorId: 'actor:1', activityId: 'node:1', view: '2d' }))
      .toBe('/?process=P001&area=actor%3A1&activity=node%3A1&view=2d')
    expect(buildOverviewHref({ processId: 'P001', view: '3d' })).toBe('/?process=P001')
  })

  it('separates unknown processes from unknown activities', () => {
    const payload = {
      id: 'P001',
      diagrams: [{ id: 'd1', nodes: [{ id: 'n1' }] }],
    } as unknown as ProcessPayload
    expect(resolveProcessRequest(['P001'], 'P999', null, null)).toEqual({ status: 'process-not-found' })
    expect(resolveProcessRequest(['P001'], 'P001', payload, 'missing')).toEqual({ status: 'activity-not-found', diagramId: 'd1' })
    expect(resolveProcessRequest(['P001'], 'P001', payload, 'n1')).toEqual({ status: 'ready', diagramId: 'd1', nodeId: 'n1' })
  })

  it('reports WebGL unavailable when neither context can be created', () => {
    expect(supportsWebGl(() => ({ getContext: () => null }))).toBe(false)
    expect(supportsWebGl(() => ({ getContext: (kind: string) => kind === 'webgl' ? {} : null }))).toBe(true)
  })
})
