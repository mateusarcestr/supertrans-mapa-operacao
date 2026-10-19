import { describe, expect, it } from 'vitest'

import { advancePlayback, createPlaybackState, chooseBranch, resetPlayback } from './playback'

const graph = {
  nodes: [
    { id: 'start', type: 'startEvent', incoming: [], outgoing: ['f1'] },
    { id: 'task', type: 'task', incoming: ['f1'], outgoing: ['f2'] },
    { id: 'gateway', type: 'gateway', incoming: ['f2'], outgoing: ['f3', 'f4'] },
    { id: 'left', type: 'task', incoming: ['f3'], outgoing: [] },
    { id: 'right', type: 'task', incoming: ['f4'], outgoing: [] },
  ],
  flows: [
    { id: 'f1', sourceNodeId: 'start', targetNodeId: 'task' },
    { id: 'f2', sourceNodeId: 'task', targetNodeId: 'gateway' },
    { id: 'f3', sourceNodeId: 'gateway', targetNodeId: 'left', label: 'Atende' },
    { id: 'f4', sourceNodeId: 'gateway', targetNodeId: 'right' },
  ],
}

describe('process playback', () => {
  it('pauses at a gateway and exposes only real outgoing choices', () => {
    let state = createPlaybackState(graph)
    state = advancePlayback(state, graph)
    state = advancePlayback(state, graph)
    state = advancePlayback(state, graph)

    expect(state.currentNodeId).toBe('gateway')
    expect(state.isPlaying).toBe(false)
    expect(state.pendingBranchNodeId).toBe('gateway')
    expect(state.branchOptions.map((option) => option.flowId)).toEqual(['f3', 'f4'])
  })

  it('continues only after the user chooses one branch', () => {
    let state = createPlaybackState(graph)
    state = advancePlayback(advancePlayback(advancePlayback(state, graph), graph), graph)
    state = chooseBranch(state, graph, 'f4')

    expect(state.currentNodeId).toBe('right')
    expect(state.traversedFlowIds).toContain('f4')
    expect(state.pendingBranchNodeId).toBeNull()
  })

  it('resets to the first start event without inventing a path', () => {
    const state = resetPlayback(graph)

    expect(state.currentNodeId).toBe('start')
    expect(state.visitedNodeIds).toEqual(['start'])
    expect(state.traversedFlowIds).toEqual([])
  })
})
