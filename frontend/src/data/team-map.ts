import type { Handoff } from './types'

export function buildTeamMap(all: Handoff[], processId: string, requestedActorId?: string) {
  const handoffs = all.filter((item) => item.processId === processId)
  const actorIds = [...new Set(handoffs.flatMap((item) => [item.fromActorId, item.toActorId]))].sort()
  const degree = (id: string) => handoffs.filter((item) => item.fromActorId === id || item.toActorId === id).length
  const focusActorId = actorIds.includes(requestedActorId ?? '') ? requestedActorId
    : [...actorIds].sort((a, b) => degree(b) - degree(a) || a.localeCompare(b))[0]
  const neighbors = (direction: 'incoming' | 'outgoing') => {
    const groups = new Map<string, Handoff[]>()
    for (const item of handoffs) {
      if (item.fromActorId === item.toActorId) continue
      if ((direction === 'incoming' ? item.toActorId : item.fromActorId) !== focusActorId) continue
      const actorId = direction === 'incoming' ? item.fromActorId : item.toActorId
      groups.set(actorId, [...groups.get(actorId) ?? [], item])
    }
    return [...groups].map(([actorId, items]) => ({ actorId, handoffs: items }))
  }
  return { handoffs, actorIds, focusActorId, incoming: neighbors('incoming'), outgoing: neighbors('outgoing'),
    internal: handoffs.filter((item) => item.fromActorId === focusActorId && item.toActorId === focusActorId) }
}
