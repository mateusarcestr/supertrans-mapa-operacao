export interface PlaybackNode {
  id: string
  type: string
  incoming: string[]
  outgoing: string[]
}

export interface PlaybackFlow {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label?: string | null
  name?: string
}

export interface PlaybackGraph {
  nodes: PlaybackNode[]
  flows: PlaybackFlow[]
}

export interface BranchOption {
  flowId: string
  targetNodeId: string
  label: string
}

export interface PlaybackState {
  currentNodeId: string | null
  visitedNodeIds: string[]
  traversedFlowIds: string[]
  isPlaying: boolean
  pendingBranchNodeId: string | null
  branchOptions: BranchOption[]
}

function firstStartNode(graph: PlaybackGraph): PlaybackNode | undefined {
  return graph.nodes.find((node) => node.type === 'startEvent') ?? graph.nodes.find((node) => node.incoming.length === 0)
}

function outgoingFlows(graph: PlaybackGraph, nodeId: string): PlaybackFlow[] {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId)
  if (!node) return []
  const byId = new Map(graph.flows.map((flow) => [flow.id, flow]))
  return node.outgoing.map((flowId) => byId.get(flowId)).filter((flow): flow is PlaybackFlow => Boolean(flow))
}

function optionsFor(graph: PlaybackGraph, nodeId: string): BranchOption[] {
  return outgoingFlows(graph, nodeId).map((flow, index) => ({
    flowId: flow.id,
    targetNodeId: flow.targetNodeId,
    label: flow.label?.trim() || flow.name?.trim() || `Caminho ${index + 1}`,
  }))
}

function move(state: PlaybackState, flow: PlaybackFlow, isPlaying = state.isPlaying): PlaybackState {
  const visitedNodeIds = state.visitedNodeIds.includes(flow.targetNodeId)
    ? state.visitedNodeIds
    : [...state.visitedNodeIds, flow.targetNodeId]
  return {
    ...state,
    currentNodeId: flow.targetNodeId,
    visitedNodeIds,
    traversedFlowIds: state.traversedFlowIds.includes(flow.id)
      ? state.traversedFlowIds
      : [...state.traversedFlowIds, flow.id],
    isPlaying,
    pendingBranchNodeId: null,
    branchOptions: [],
  }
}

export function createPlaybackState(graph: PlaybackGraph): PlaybackState {
  const start = firstStartNode(graph)
  return {
    currentNodeId: start?.id ?? null,
    visitedNodeIds: start ? [start.id] : [],
    traversedFlowIds: [],
    isPlaying: false,
    pendingBranchNodeId: null,
    branchOptions: [],
  }
}

export function resetPlayback(graph: PlaybackGraph): PlaybackState {
  return createPlaybackState(graph)
}

export function advancePlayback(state: PlaybackState, graph: PlaybackGraph): PlaybackState {
  if (!state.currentNodeId || state.pendingBranchNodeId) return state
  const flows = outgoingFlows(graph, state.currentNodeId)
  if (flows.length === 0) return { ...state, isPlaying: false }
  if (flows.length > 1) {
    return {
      ...state,
      isPlaying: false,
      pendingBranchNodeId: state.currentNodeId,
      branchOptions: optionsFor(graph, state.currentNodeId),
    }
  }
  return move(state, flows[0])
}

export function chooseBranch(state: PlaybackState, graph: PlaybackGraph, flowId: string): PlaybackState {
  if (!state.pendingBranchNodeId) return state
  const flow = outgoingFlows(graph, state.pendingBranchNodeId).find((candidate) => candidate.id === flowId)
  return flow ? move(state, flow, true) : state
}
