import type { FrontendCatalog, Handoff } from './types'

export function documentedPassages(catalog: FrontendCatalog, processId: string, flowId: string): Handoff[] {
  return (catalog.handoffs as Handoff[]).filter((item) => item.processId === processId && item.flowId === flowId)
}

export function operationEntryHref(catalog: FrontendCatalog, params: URLSearchParams): string {
  const requested = params.get('process')
  const activity = params.get('activity')
  const actor = params.get('area')
  const actorPassage = (catalog.handoffs as Handoff[]).find(
    (item) => (!requested || item.processId === requested) && [item.fromActorId, item.toActorId].includes(actor ?? ''),
  )
  const activityProcess = catalog.activityIndex.find((item) => item.id === activity)?.processId
  const processId =
    catalog.processes.find((item) => item.id === requested)?.id ?? activityProcess ?? actorPassage?.processId ?? catalog.processes[0]?.id
  if (!processId) return '/operacao/indisponivel'
  const selection = new URLSearchParams()
  const nodeId =
    activity ?? (actorPassage ? (actorPassage.fromActorId === actor ? actorPassage.sourceNodeId : actorPassage.targetNodeId) : undefined)
  if (nodeId) selection.set('activity', nodeId)
  if (params.get('diagram')) selection.set('diagram', params.get('diagram')!)
  const query = selection.toString()
  return `/operacao/${encodeURIComponent(processId)}${query ? `?${query}` : ''}`
}
