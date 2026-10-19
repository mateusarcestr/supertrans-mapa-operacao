import { useEffect, useMemo, useRef, useState } from 'react'

import { conflictsForNode, nodeDisplayName, nodeTypeLabel } from '../data/model'
import { classifyReadiness } from '../data/readiness'
import type { FrontendCatalog, ProcessDiagram, ProcessNode } from '../data/types'
import { ConfidenceBadge } from './ConfidenceBadge'

interface ProcessGraphProps {
  diagram: ProcessDiagram
  catalog: FrontendCatalog
  selectedNodeId: string | null
  currentNodeId: string | null
  visitedNodeIds: string[]
  traversedFlowIds: string[]
  onSelect: (node: ProcessNode) => void
}

// Keep the source diagram's topology visible at a readable desktop scale.
// The frame scrolls horizontally for dense diagrams instead of shrinking all labels.

function truncate(value: string, length = 28) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

function flowPath(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number },
) {
  const sourceCenterX = source.x + source.width / 2
  const sourceCenterY = source.y + source.height / 2
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2
  const deltaX = targetCenterX - sourceCenterX
  const deltaY = targetCenterY - sourceCenterY

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    const direction = deltaX >= 0 ? 1 : -1
    const startX = sourceCenterX + (direction * source.width) / 2
    const endX = targetCenterX - (direction * target.width) / 2
    const curve = Math.max(24, Math.abs(endX - startX) * 0.42)
    return `M ${startX} ${sourceCenterY} C ${startX + direction * curve} ${sourceCenterY}, ${endX - direction * curve} ${targetCenterY}, ${endX} ${targetCenterY}`
  }

  const direction = deltaY >= 0 ? 1 : -1
  const startY = sourceCenterY + (direction * source.height) / 2
  const endY = targetCenterY - (direction * target.height) / 2
  const curve = Math.max(24, Math.abs(endY - startY) * 0.42)
  return `M ${sourceCenterX} ${startY} C ${sourceCenterX} ${startY + direction * curve}, ${targetCenterX} ${endY - direction * curve}, ${targetCenterX} ${endY}`
}

function focusNodeInFrame(frame: HTMLDivElement, nodeId: string, behavior: ScrollBehavior = 'smooth') {
  const node = frame.querySelector<SVGGElement>(`[data-node-id="${CSS.escape(nodeId)}"]`)
  if (!node) return

  const frameRect = frame.getBoundingClientRect()
  const nodeRect = node.getBoundingClientRect()
  const contentLeft = frame.scrollLeft + nodeRect.left - frameRect.left - frame.clientLeft
  const contentTop = frame.scrollTop + nodeRect.top - frameRect.top - frame.clientTop
  const left = contentLeft + nodeRect.width / 2 - frame.clientWidth * 0.32
  const top = contentTop + nodeRect.height / 2 - frame.clientHeight * 0.2

  frame.scrollTo({
    left: Math.max(0, Math.min(left, frame.scrollWidth - frame.clientWidth)),
    top: Math.max(0, Math.min(top, frame.scrollHeight - frame.clientHeight)),
    behavior,
  })
}

function parseActivityName(name: string) {
  const match = name.match(/^(\d+[\.\-]?)\s*(.*)/)
  if (match) {
    let id = match[1]
    if (id.endsWith('.') || id.endsWith('-')) id = id.slice(0, -1)
    if (id.length === 1) id = '0' + id
    return (
      <>
        <span className="activity-id">{id}</span>
        <span className="activity-text">{match[2]}</span>
      </>
    )
  }
  return <span className="activity-text">{name}</span>
}

export function ProcessGraph({
  diagram,
  catalog,
  selectedNodeId,
  currentNodeId,
  visitedNodeIds,
  traversedFlowIds,
  onSelect,
}: ProcessGraphProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.75)
  const layout = useMemo(() => {
    const drawableNodes = diagram.nodes.filter((node) => node.bounds)
    const minX = Math.min(...drawableNodes.map((node) => node.bounds?.x ?? 0), 0)
    const minY = Math.min(...drawableNodes.map((node) => node.bounds?.y ?? 0), 0)

    const SPATIAL_MULTIPLIER = 2.4
    const offsetX = 80
    const offsetY = 80

    let newMaxX = 0
    let newMaxY = 0

    const nodePositions = new Map<string, { x: number; y: number; width: number; height: number }>()
    for (const [index, node] of diagram.nodes.entries()) {
      const bounds = node.bounds ?? { x: index * 120, y: 80 + (index % 4) * 90, width: 100, height: 42 }

      let width = 220
      let height = 68
      if (node.type === 'gateway') {
        width = 50
        height = 50
      } else if (node.type.endsWith('Event')) {
        width = 40
        height = 40
      } else if (node.type === 'subprocess') {
        width = 220
        height = 68
      }

      const originalCenterX = bounds.x - minX + bounds.width / 2
      const originalCenterY = bounds.y - minY + bounds.height / 2

      const scaledCenterX = originalCenterX * SPATIAL_MULTIPLIER
      const scaledCenterY = originalCenterY * SPATIAL_MULTIPLIER

      const x = offsetX + scaledCenterX - width / 2
      const y = offsetY + scaledCenterY - height / 2

      if (x + width > newMaxX) newMaxX = x + width
      if (y + height > newMaxY) newMaxY = y + height

      nodePositions.set(node.id, { x, y, width, height })
    }

    const canvasWidth = newMaxX + offsetX * 2
    const canvasHeight = newMaxY + offsetY * 2

    const lanePositions = new Map(
      diagram.lanes
        .filter((lane) => lane.bounds)
        .map((lane) => {
          const bounds = lane.bounds!
          const originalCenterX = bounds.x - minX + bounds.width / 2
          const originalCenterY = bounds.y - minY + bounds.height / 2
          const scaledCenterX = originalCenterX * SPATIAL_MULTIPLIER
          const scaledCenterY = originalCenterY * SPATIAL_MULTIPLIER

          const width = bounds.width * SPATIAL_MULTIPLIER
          const height = bounds.height * SPATIAL_MULTIPLIER

          return [
            lane.id,
            {
              x: offsetX + scaledCenterX - width / 2,
              y: offsetY + scaledCenterY - height / 2,
              width,
              height,
            },
          ]
        }),
    )

    return { nodePositions, lanePositions, scale: 1, canvasWidth, canvasHeight }
  }, [diagram])

  useEffect(() => {
    const frame = frameRef.current
    const firstNode = diagram.nodes.find((node) => node.type === 'startEvent') ?? diagram.nodes[0]
    const focusId = currentNodeId ?? selectedNodeId ?? firstNode?.id
    if (!frame || !focusId) return

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => focusNodeInFrame(frame, focusId, 'instant'))
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [currentNodeId, diagram.id, diagram.nodes, layout.canvasHeight, layout.canvasWidth, selectedNodeId, zoom])

  const neighborIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const set = new Set<string>()
    diagram.flows.forEach((f) => {
      if (f.sourceNodeId === selectedNodeId) set.add(f.targetNodeId)
      if (f.targetNodeId === selectedNodeId) set.add(f.sourceNodeId)
    })
    return set
  }, [diagram.flows, selectedNodeId])

  const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]))

  return (
    <div className="graph-frame" ref={frameRef}>
      <div className="graph-view-controls" aria-label="Controles do diagrama">
        <button aria-label="Reduzir zoom" onClick={() => setZoom((value) => Math.max(0.45, Number((value - 0.1).toFixed(2))))}>
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button aria-label="Aumentar zoom" onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))}>
          +
        </button>
        <button
          onClick={() => {
            const frame = frameRef.current
            if (frame) setZoom(Math.max(0.52, Math.min(1, (frame.clientWidth - 24) / layout.canvasWidth)))
          }}
        >
          Ajustar
        </button>
        <button
          disabled={!selectedNodeId}
          onClick={() => {
            const frame = frameRef.current
            if (frame && selectedNodeId) focusNodeInFrame(frame, selectedNodeId)
          }}
        >
          Focar seleção
        </button>
      </div>
      <div className="graph-legend">
        <span>
          <i className="legend-swatch legend-task" />
          Atividade
        </span>
        <span>
          <i className="legend-swatch legend-event" />
          Evento
        </span>
        <span>
          <i className="legend-swatch legend-gateway" />
          Decisão
        </span>
        <span>
          <i className="legend-swatch legend-subflow" />
          Subprocesso unresolved
        </span>
      </div>
      <svg
        className="process-graph"
        style={{ width: layout.canvasWidth * zoom, height: layout.canvasHeight * zoom }}
        viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
        role="img"
        aria-label={`Fluxo do diagrama ${diagram.name}`}
      >
        <defs>
          <marker id="process-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L7,3 z" fill="currentColor" />
          </marker>
        </defs>
        <g className="lane-guides">
          {diagram.lanes.map((lane) => {
            const lanePosition = layout.lanePositions.get(lane.id)
            if (!lanePosition) return null
            return (
              <g key={lane.id} aria-label={`Lane inferida ${lane.name}`}>
                <rect
                  className="lane-guide"
                  x={lanePosition.x}
                  y={lanePosition.y}
                  width={lanePosition.width}
                  height={lanePosition.height}
                  rx={8}
                />
                <text x={lanePosition.x + 10} y={lanePosition.y + 18} className="lane-label">
                  {truncate(lane.name, 34)} · inferido
                </text>
              </g>
            )
          })}
        </g>
        <g className="graph-flows">
          {diagram.flows.map((flow) => {
            const source = layout.nodePositions.get(flow.sourceNodeId)
            const target = layout.nodePositions.get(flow.targetNodeId)
            if (!source || !target || !nodeById.has(flow.sourceNodeId) || !nodeById.has(flow.targetNodeId)) return null
            const traversed = traversedFlowIds.includes(flow.id)
            const isHighlight = selectedNodeId ? flow.sourceNodeId === selectedNodeId || flow.targetNodeId === selectedNodeId : false
            const isDimmed = selectedNodeId && !isHighlight && !traversed
            return (
              <path
                key={flow.id}
                className={`graph-flow ${traversed ? 'is-traversed' : ''} ${isHighlight ? 'is-highlight' : ''} ${isDimmed ? 'is-dimmed' : ''}`}
                d={flowPath(source, target)}
                markerEnd="url(#process-arrow)"
              />
            )
          })}
        </g>
        <g className="graph-nodes">
          {diagram.nodes.map((node) => {
            const position = layout.nodePositions.get(node.id)
            if (!position) return null
            const isSelected = selectedNodeId === node.id
            const isCurrent = currentNodeId === node.id
            const isVisited = visitedNodeIds.includes(node.id)
            const unresolved = node.type === 'subprocess' && node.subflowResolutionStatus === 'unresolved'
            const conflicts = conflictsForNode(catalog, node.id)
            const readiness = classifyReadiness({
              assignmentMethod: node.laneAssignment?.assignmentMethod as 'explicit' | 'geometry' | 'unresolved' | undefined,
              assignmentClassification: node.laneAssignment?.classification as 'confirmed' | 'inferred' | 'unknown' | undefined,
              reconciliationStatus: node.reconciliationStatus as
                | 'matched'
                | 'partially-matched'
                | 'ambiguous'
                | 'unmatched-bizagi'
                | 'unmatched-pop'
                | undefined,
              hasSourceConflict: conflicts.length > 0,
              subprocessResolution: unresolved ? 'unresolved' : undefined,
            })
            const cx = position.x + position.width / 2
            const cy = position.y + position.height / 2
            const gateway = node.type === 'gateway'
            const event = node.type.endsWith('Event')
            const isNeighbor = neighborIds.has(node.id)
            const isDimmed = selectedNodeId && !isSelected && !isNeighbor && !isCurrent
            const className = `graph-node graph-node-${node.type} ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-current' : ''} ${isVisited ? 'is-visited' : ''} ${unresolved ? 'is-unresolved' : ''} ${isDimmed ? 'is-dimmed' : ''}`
            return (
              <g
                key={node.id}
                className={className}
                tabIndex={0}
                role="button"
                aria-label={`${nodeTypeLabel(node)}: ${nodeDisplayName(node)}`}
                data-node-id={node.id}
                onClick={() => onSelect(node)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelect(node)
                }}
              >
                {gateway ? (
                  <polygon
                    points={`${cx},${position.y} ${position.x + position.width},${cy} ${cx},${position.y + position.height} ${position.x},${cy}`}
                  />
                ) : event ? (
                  <circle cx={cx} cy={cy} r={Math.max(Math.min(position.width, position.height) / 2, 12)} />
                ) : (
                  <rect x={position.x} y={position.y} width={position.width} height={position.height} rx={unresolved ? 5 : 8} />
                )}

                {node.type === 'task' || node.type === 'subprocess' ? (
                  <foreignObject x={position.x} y={position.y} width={position.width} height={position.height}>
                    <div className="activity-node" title={nodeDisplayName(node)}>
                      {parseActivityName(nodeDisplayName(node))}
                    </div>
                  </foreignObject>
                ) : (
                  <text
                    x={cx}
                    y={gateway || event ? position.y + position.height + 16 : cy}
                    textAnchor="middle"
                    className="graph-node-label"
                  >
                    {truncate(nodeDisplayName(node), 32)}
                  </text>
                )}

                {readiness !== 'READY' && (
                  <text
                    x={position.x + position.width - 4}
                    y={position.y + 12}
                    textAnchor="end"
                    className={`graph-node-marker marker-${readiness.toLowerCase()}`}
                  >
                    {readiness === 'READY_WITH_SOURCE_CONFLICT'
                      ? '!'
                      : readiness === 'NOT_AVAILABLE'
                        ? '-'
                        : readiness === 'READY_WITH_INFERENCE_BADGE'
                          ? '?'
                          : '?'}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      <div className="graph-caption">
        <span>{diagram.name}</span>
        <span>
          {diagram.nodes.length} elementos · {diagram.flows.length} flows
        </span>
        <ConfidenceBadge state="READY" compact />
      </div>
    </div>
  )
}
