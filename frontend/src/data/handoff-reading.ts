import { splitHandoffActivityNames } from './presentation'
import type { Handoff } from './types'

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

// Reading order from documented activity labels, not a reconstructed workflow.
export function groupHandoffsForReading(handoffs: Handoff[]): { processId: string; items: Handoff[] }[] {
  const groups = new Map<string, Handoff[]>()
  for (const handoff of handoffs) {
    const items = groups.get(handoff.processId) ?? []
    items.push(handoff)
    groups.set(handoff.processId, items)
  }
  return [...groups]
    .sort(([left], [right]) => collator.compare(left, right))
    .map(([processId, items]) => ({
      processId,
      items: items.sort((left, right) => {
        const a = splitHandoffActivityNames(left.name)
        const b = splitHandoffActivityNames(right.name)
        const hasCodeA = /^\d+(?:\.\d+)*\./.test(a.source)
        const hasCodeB = /^\d+(?:\.\d+)*\./.test(b.source)
        return (
          Number(hasCodeB) - Number(hasCodeA) ||
          collator.compare(a.source, b.source) ||
          collator.compare(a.destination ?? '', b.destination ?? '') ||
          collator.compare(left.id, right.id)
        )
      }),
    }))
}
