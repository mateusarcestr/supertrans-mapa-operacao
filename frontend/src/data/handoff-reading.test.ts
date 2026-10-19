import { expect, it } from 'vitest'
import { groupHandoffsForReading } from './handoff-reading'
import type { Handoff } from './types'

it('groups by process and orders activity codes numerically without dropping branches or returns', () => {
  const row = (id: string, processId: string, name: string): Handoff => ({
    id, processId, name, fromActorId: 'a', toActorId: 'b', sourceNodeId: id,
    targetNodeId: `${id}-target`, flowId: `${id}-flow`, classification: 'inferred', sources: [],
  })
  const rows = [row('late', 'P001', '57.12. Sai → 57.13. Chega'), row('other', 'P002', '1. Sai → 2. Chega'),
    row('ten', 'P001', '10. Sai → 11. Chega'), row('branch', 'P001', '2. Sai → 4. Ramo'),
    row('return', 'P001', '2. Sai → 1. Retorna'), row('unknown', 'P001', 'Sem código → Destino')]
  const before = JSON.stringify(rows)
  const groups = groupHandoffsForReading(rows)
  expect(groups.map((group) => group.processId)).toEqual(['P001', 'P002'])
  expect(groups[0].items.map((item) => item.id)).toEqual(['return', 'branch', 'ten', 'late', 'unknown'])
  expect(groups.flatMap((group) => group.items).map((item) => item.id).sort()).toEqual(rows.map((item) => item.id).sort())
  expect(groups[0].items[0]).toBe(rows[4])
  expect(JSON.stringify(rows)).toBe(before)
  expect(groupHandoffsForReading([])).toEqual([])
})
