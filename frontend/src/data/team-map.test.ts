import { expect, it } from 'vitest'
import { buildTeamMap } from './team-map'
import type { Handoff } from './types'

it('keeps direction and every source handoff within the selected process', () => {
  const row = (id: string, from: string, to: string, processId = 'P001'): Handoff => ({
    id,
    processId,
    name: id,
    fromActorId: from,
    toActorId: to,
    sourceNodeId: `${id}-from`,
    targetNodeId: `${id}-to`,
    flowId: id,
    sources: [],
    classification: 'inferred',
  })
  const rows = [
    row('one', 'a', 'b'),
    row('two', 'a', 'b'),
    row('return', 'b', 'a'),
    row('next', 'b', 'c'),
    row('self', 'b', 'b'),
    row('other', 'a', 'd', 'P002'),
  ]
  const snapshot = JSON.stringify(rows)
  const model = buildTeamMap(rows, 'P001', 'b')
  expect(model.actorIds).toEqual(['a', 'b', 'c'])
  expect(model.incoming.map((item) => [item.actorId, item.handoffs.map((h) => h.id)])).toEqual([['a', ['one', 'two']]])
  expect(model.outgoing.map((item) => [item.actorId, item.handoffs.map((h) => h.id)])).toEqual([
    ['a', ['return']],
    ['c', ['next']],
  ])
  expect(model.internal.map((item) => item.id)).toEqual(['self'])
  expect(model.handoffs).toHaveLength(5)
  expect(buildTeamMap(rows, 'P001').focusActorId).toBe('b')
  expect(buildTeamMap(rows, 'P001', 'unknown').focusActorId).toBe('b')
  expect(buildTeamMap([], 'P001').focusActorId).toBeUndefined()
  expect(JSON.stringify(rows)).toBe(snapshot)
})
