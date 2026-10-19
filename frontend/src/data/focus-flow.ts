import type { ProcessDiagram } from './types'

export function buildFocusFlow(diagram: ProcessDiagram, nodeId: string | null) {
  const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]))
  const node = nodeId ? nodeById.get(nodeId) : undefined
  return {
    node,
    incoming: node ? diagram.flows.filter((flow) => flow.targetNodeId === node.id).map((flow) => ({ flow, node: nodeById.get(flow.sourceNodeId) })) : [],
    outgoing: node ? diagram.flows.filter((flow) => flow.sourceNodeId === node.id).map((flow) => ({ flow, node: nodeById.get(flow.targetNodeId) })) : [],
  }
}
