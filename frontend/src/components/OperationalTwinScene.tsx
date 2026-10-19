import { useTheme } from './ThemeToggle'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { CanvasTexture, LinearFilter } from 'three'

import type { DataConfidenceState } from '../data/readiness'
import { supportsWebGl } from '../data/presentation'
import {
  filterTwinRoutes,
  type OperationalTwinModel,
  type TwinActivityMarker,
  type TwinLayers,
  type TwinPosition,
  type TwinResource,
  type TwinRoute,
} from '../data/twin'

interface OperationalTwinSceneProps {
  model: OperationalTwinModel
  layers: TwinLayers
  selectedProcessId?: string
  selectedActorId?: string
  selectedActivityId?: string
  selectedResourceId?: string
  activityMarkers: TwinActivityMarker[]
  traversedFlowIds?: string[]
  cameraCommand: number
  cameraMode: 'reset' | 'fit' | 'focus'
  onSelectProcess: (processId: string) => void
  onSelectActor: (actorId: string) => void
  onSelectActivity: (activityId: string) => void
  onSelectResource: (resourceId: string) => void
  onClearSelection: () => void
  onUse2D: () => void
}

function confidenceColor(state: DataConfidenceState, isLight: boolean = false): string {
  switch (state) {
    case 'READY_WITH_SOURCE_CONFLICT':
      return isLight ? '#d97706' : '#efb562'
    case 'NEEDS_HUMAN_REVIEW':
      return isLight ? '#6d28d9' : '#b8a5f4'
    case 'NOT_AVAILABLE':
      return '#d4a55a'
    case 'READY_WITH_INFERENCE_BADGE':
      return '#58c8c0'
    default:
      return '#69d391'
  }
}

function CanvasLabel({
  title,
  subtitle,
  position,
  width = 2.8,
  onSelect,
}: {
  title: string
  subtitle: string
  position: TwinPosition
  width?: number
  onSelect: () => void
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = 'rgba(6, 23, 36, 0.95)'
      context.strokeStyle = 'rgba(88, 200, 192, 0.72)'
      context.lineWidth = 3
      context.beginPath()
      context.roundRect(3, 3, 506, 122, 16)
      context.fill()
      context.stroke()
      context.fillStyle = '#e8f7f8'
      context.font = '600 28px Arial, sans-serif'
      context.fillText(title.length > 30 ? `${title.slice(0, 29)}…` : title, 24, 50)
      context.fillStyle = '#8fb3bd'
      context.font = '20px Arial, sans-serif'
      context.fillText(subtitle.length > 42 ? `${subtitle.slice(0, 41)}…` : subtitle, 24, 91)
    }
    const next = new CanvasTexture(canvas)
    next.minFilter = LinearFilter
    next.needsUpdate = true
    return next
  }, [subtitle, title])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <sprite
      position={position}
      scale={[width, width / 4, 1]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  )
}

function AreaMesh({
  area,
  selected,
  labelled,
  onSelect,
}: {
  area: OperationalTwinModel['areas'][number]
  selected: boolean
  labelled: boolean
  onSelect: () => void
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [hovered, setHovered] = useState(false)
  const size = area.classification === 'external' ? 0.9 : area.classification === 'internal' ? 1.2 : 1.05
  const fill = area.classification === 'internal' ? '#1d6670' : area.classification === 'external' ? '#36536b' : '#526678'
  const showLabel = labelled || hovered || selected
  return (
    <group position={[area.position[0], area.height / 2, area.position[2]]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[size, area.height * 1.35, size]} />
        <meshStandardMaterial
          color={fill}
          emissive={selected ? (isLight ? '#0f766e' : '#3ea8a0') : isLight ? '#f8fafb' : '#071b2a'}
          emissiveIntensity={selected ? 0.85 : 0.18}
          roughness={0.58}
          metalness={0.16}
        />
      </mesh>
      <Line
        points={ring((area.height * 1.35) / 2 + 0.035, size * 0.78)}
        color={selected ? (isLight ? '#0f766e' : '#9df8f0') : isLight ? '#0f766e' : '#58c8c0'}
        lineWidth={selected ? 1.6 : 0.75}
        dashed
        dashSize={0.16}
        gapSize={0.12}
      />
      {showLabel && (
        <CanvasLabel
          title={area.name}
          subtitle={`${area.classification === 'unknown' ? 'Tipo não determinado' : area.classification} · ◇ Inferido`}
          position={[0, area.height / 2 + 0.46, 0]}
          width={2.1}
          onSelect={onSelect}
        />
      )}
    </group>
  )
}

function ring(y: number, radius: number): [number, number, number][] {
  return Array.from({ length: 25 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 24
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
  })
}

function RouteLine({
  route,
  from,
  to,
  selected,
  traversed,
  dimmed,
  handoffsVisible,
  onSelect,
}: {
  route: TwinRoute
  from: OperationalTwinModel['areas'][number]
  to: OperationalTwinModel['areas'][number]
  selected: boolean
  traversed: boolean
  dimmed: boolean
  handoffsVisible: boolean
  onSelect: () => void
}) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [hovered, setHovered] = useState(false)
  const mid: TwinPosition = [
    Number(((from.position[0] + to.position[0]) / 2).toFixed(3)),
    selected ? 0.42 : 0.24,
    Number(((from.position[2] + to.position[2]) / 2).toFixed(3)),
  ]
  const points: TwinPosition[] = [
    [from.position[0], from.height + 0.08, from.position[2]],
    mid,
    [to.position[0], to.height + 0.08, to.position[2]],
  ]
  const alpha = dimmed ? 0.13 : selected || hovered || traversed ? 1 : 0.52
  return (
    <group>
      <Line
        points={points}
        color={traversed ? (isLight ? '#059669' : '#69d391') : selected || hovered ? (isLight ? '#0f766e' : '#e5ffff') : route.color}
        lineWidth={selected || hovered || traversed ? 3.5 : 1.5}
        transparent
        opacity={alpha}
        dashed={!selected}
        dashSize={0.22}
        gapSize={0.14}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      />
      {handoffsVisible && (
        <mesh
          position={mid}
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        >
          <sphereGeometry args={[selected ? 0.11 : 0.075, 12, 12]} />
          <meshStandardMaterial
            color={confidenceColor(route.confidence, isLight)}
            emissive={confidenceColor(route.confidence, isLight)}
            emissiveIntensity={0.35}
          />
        </mesh>
      )}
      {hovered && (
        <CanvasLabel
          title={`${route.processId} · ${route.processName}`}
          subtitle={`${from.name} → ${to.name} · derived-from-inferred-assignment`}
          position={[mid[0], mid[1] + 0.26, mid[2]]}
          width={3.2}
          onSelect={onSelect}
        />
      )}
    </group>
  )
}

function ActivityMarker({ marker, selected, onSelect }: { marker: TwinActivityMarker; selected: boolean; onSelect: () => void }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [hovered, setHovered] = useState(false)
  const color = confidenceColor(marker.readiness, isLight)
  const primitive = marker.unresolved ? (
    <coneGeometry args={[0.14, 0.32, 4]} />
  ) : marker.type === 'gateway' ? (
    <octahedronGeometry args={[0.14]} />
  ) : (
    <sphereGeometry args={[0.1, 10, 10]} />
  )
  const icon = marker.unresolved
    ? '—'
    : marker.readiness === 'READY_WITH_SOURCE_CONFLICT'
      ? '!'
      : marker.readiness === 'NEEDS_HUMAN_REVIEW'
        ? '?'
        : '◇'
  return (
    <group position={marker.position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {primitive}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.95 : 0.38} />
      </mesh>
      {(selected || hovered || marker.unresolved) && (
        <CanvasLabel
          title={marker.name}
          subtitle={marker.unresolved ? 'Destino do subprocesso não resolvido' : icon}
          position={[0, 0.33, 0]}
          width={2.5}
          onSelect={onSelect}
        />
      )}
    </group>
  )
}

function ResourceMarker({ resource, selected, onSelect }: { resource: TwinResource; selected: boolean; onSelect: () => void }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [hovered, setHovered] = useState(false)
  const color = resource.kind === 'system' ? '#8bbcc6' : resource.kind === 'channel' ? '#b8a5f4' : '#d3ad7b'
  return (
    <group position={resource.position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {resource.kind === 'system' ? (
          <boxGeometry args={[0.22, 0.22, 0.22]} />
        ) : resource.kind === 'channel' ? (
          <sphereGeometry args={[0.14, 10, 10]} />
        ) : (
          <coneGeometry args={[0.14, 0.25, 4]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={selected ? color : isLight ? '#f8fafb' : '#071b2a'}
          emissiveIntensity={selected ? 0.75 : 0.2}
        />
      </mesh>
      {(selected || hovered) && (
        <CanvasLabel title={resource.name} subtitle={resource.kind} position={[0, 0.28, 0]} width={2.3} onSelect={onSelect} />
      )}
    </group>
  )
}

function CameraDirector({
  command,
  target,
  mode,
}: {
  command: number
  target: TwinPosition
  mode: OperationalTwinSceneProps['cameraMode']
}) {
  const controls = useRef<any>(null)
  const { camera } = useThree()
  useEffect(() => {
    const distance = mode === 'fit' ? 15 : mode === 'focus' ? 7 : 11
    camera.position.set(target[0] + distance, target[1] + distance * 0.82, target[2] + distance)
    controls.current?.target.set(target[0], target[1], target[2])
    controls.current?.update()
  }, [camera, command, mode, target])
  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      minDistance={5.5}
      maxDistance={28}
      minPolarAngle={0.45}
      maxPolarAngle={1.38}
      maxAzimuthAngle={Math.PI * 0.78}
      minAzimuthAngle={-Math.PI * 0.78}
    />
  )
}

function SceneContent({
  model,
  layers,
  selectedProcessId,
  selectedActorId,
  selectedActivityId,
  selectedResourceId,
  activityMarkers,
  traversedFlowIds = [],
  cameraCommand,
  cameraMode,
  onSelectProcess,
  onSelectActor,
  onSelectActivity,
  onSelectResource,
  onClearSelection,
}: Omit<OperationalTwinSceneProps, 'onUse2D'>) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const areaById = useMemo(() => new Map(model.areas.map((area) => [area.actorId, area])), [model.areas])
  const visibleRoutes = useMemo(() => filterTwinRoutes(model.routes, layers, selectedProcessId), [layers, model.routes, selectedProcessId])
  const allProcessAreas = selectedProcessId
    ? (model.routes
        .filter((route) => route.processId === selectedProcessId)
        .flatMap((route) => [areaById.get(route.fromActorId), areaById.get(route.toActorId)])
        .filter(Boolean) as OperationalTwinModel['areas'])
    : []
  const targetArea = selectedActorId ? areaById.get(selectedActorId) : undefined
  const focusTarget: TwinPosition =
    targetArea?.position ??
    (allProcessAreas.length
      ? [
          allProcessAreas.reduce((sum, area) => sum + area.position[0], 0) / allProcessAreas.length,
          0,
          allProcessAreas.reduce((sum, area) => sum + area.position[2], 0) / allProcessAreas.length,
        ]
      : [0, 0, 0])
  const target: TwinPosition = cameraMode === 'focus' ? focusTarget : [0, 0, 0]
  const labelled = new Set(
    model.areas
      .slice()
      .sort((a, b) => b.handoffCount - a.handoffCount)
      .slice(0, 4)
      .map((area) => area.actorId),
  )
  if (selectedProcessId) {
    allProcessAreas.forEach((area) => labelled.add(area.actorId))
  }

  const filteredActivities = activityMarkers.filter((marker) => {
    if (marker.id === selectedActivityId) return true
    if (marker.unresolved) return true
    if (marker.type === 'gateway') return layers.decisions
    return layers.activities
  })
  const selectedMarker = selectedActivityId ? filteredActivities.find((marker) => marker.id === selectedActivityId) : undefined
  const visibleActivities = [
    ...(selectedMarker ? [selectedMarker] : []),
    ...filteredActivities.filter((marker) => marker.id !== selectedMarker?.id),
  ].slice(0, 76)

  return (
    <>
      <color attach="background" args={[isLight ? '#f2f6f8' : '#061724']} />
      <fog attach="fog" args={[isLight ? '#f2f6f8' : '#061724', 17, 35]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[7, 12, 4]} intensity={1.15} color={isLight ? '#ffffff' : '#bceff0'} />
      <pointLight position={[-7, 5, -6]} intensity={1.4} color={isLight ? '#a8d4d8' : '#2c7d86'} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[35, 35]} />
        <meshStandardMaterial color={isLight ? '#ffffff' : '#092333'} roughness={0.88} metalness={0.05} />
      </mesh>
      <gridHelper args={[30, 20, isLight ? '#cbd5e1' : '#1c556b', isLight ? '#cbd5e1' : '#10394d']} position={[0, 0.01, 0]} />
      {layers.areas &&
        model.areas.map((area) => (
          <AreaMesh
            key={area.actorId}
            area={area}
            selected={area.actorId === selectedActorId}
            labelled={labelled.has(area.actorId)}
            onSelect={() => onSelectActor(area.actorId)}
          />
        ))}
      {visibleRoutes.map((route) => {
        const from = areaById.get(route.fromActorId)
        const to = areaById.get(route.toActorId)
        return from && to ? (
          <RouteLine
            key={route.id}
            route={route}
            from={from}
            to={to}
            selected={route.processId === selectedProcessId}
            traversed={route.flowIds.some((flowId) => traversedFlowIds.includes(flowId))}
            dimmed={Boolean(selectedProcessId && route.processId !== selectedProcessId)}
            handoffsVisible={layers.handoffs}
            onSelect={() => onSelectProcess(route.processId)}
          />
        ) : null
      })}
      {(layers.activities || layers.decisions || activityMarkers.some((marker) => marker.unresolved)) &&
        visibleActivities.map((marker) => (
          <ActivityMarker
            key={marker.id}
            marker={marker}
            selected={marker.id === selectedActivityId}
            onSelect={() => onSelectActivity(marker.id)}
          />
        ))}
      {layers.systems &&
        model.resources.map((resource) => (
          <ResourceMarker
            key={resource.id}
            resource={resource}
            selected={resource.id === selectedResourceId}
            onSelect={() => onSelectResource(resource.id)}
          />
        ))}
      <CameraDirector command={cameraCommand} target={target} mode={cameraMode} />
      <mesh position={[target[0], 0.12, target[2]]}>
        <ringGeometry args={[0.22, 0.3, 32]} />
        <meshBasicMaterial color={isLight ? '#0f766e' : '#61d3c9'} transparent opacity={0.7} />
      </mesh>
      <group onClick={onClearSelection} />
    </>
  )
}

function TwinFallback({ onUse2D }: { onUse2D: () => void }) {
  return (
    <div className="twin-fallback">
      <span className="eyebrow">Visualização</span>
      <h2>Visualização 3D indisponível</h2>
      <p>Este navegador não disponibilizou WebGL. A navegação operacional continua disponível em 2D.</p>
      <button className="secondary-button" onClick={onUse2D}>
        Usar visão 2D
      </button>
    </div>
  )
}

export function OperationalTwinScene(props: OperationalTwinSceneProps) {
  const [available, setAvailable] = useState<boolean | null>(null)
  useEffect(() => {
    setAvailable(supportsWebGl(() => document.createElement('canvas')))
  }, [])
  if (available === null)
    return (
      <div className="twin-loading">
        <span className="loading-pulse" />
        Preparando visualização 3D…
      </div>
    )
  if (!available) return <TwinFallback onUse2D={props.onUse2D} />
  return (
    <div className="twin-canvas" role="region" aria-label="Mapa 3D conceitual da operação">
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [11, 10, 11], fov: 48 }} onPointerMissed={props.onClearSelection}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  )
}
