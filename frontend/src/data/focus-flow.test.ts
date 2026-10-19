import { expect, it } from 'vitest'
import { buildFocusFlow } from './focus-flow'
import type { ProcessDiagram } from './types'

it('shows only actual adjacent transitions, preserving branches, returns and unresolved endpoints', () => {
  const diagram = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    flows: [
      { id: 'in', sourceNodeId: 'a', targetNodeId: 'b' },
      { id: 'out', sourceNodeId: 'b', targetNodeId: 'c' },
      { id: 'return', sourceNodeId: 'b', targetNodeId: 'a' },
      { id: 'missing', sourceNodeId: 'b', targetNodeId: 'outside' },
      { id: 'unrelated', sourceNodeId: 'a', targetNodeId: 'c' },
    ],
  } as unknown as ProcessDiagram
  const snapshot = JSON.stringify(diagram)
  const focus = buildFocusFlow(diagram, 'b')
  expect(focus.node?.id).toBe('b')
  expect(focus.incoming.map((item) => item.flow.id)).toEqual(['in'])
  expect(focus.outgoing.map((item) => item.flow.id)).toEqual(['out', 'return', 'missing'])
  expect(focus.outgoing[2].node).toBeUndefined()
  expect(buildFocusFlow(diagram, 'unknown').node).toBeUndefined()
  expect(JSON.stringify(diagram)).toBe(snapshot)
})
