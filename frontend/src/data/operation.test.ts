import { expect, it } from 'vitest'
import { operationEntryHref, documentedPassages } from './operation'
import type { FrontendCatalog } from './types'

const catalog = {
  processes: [{ id: 'P001' }, { id: 'P002' }],
  activityIndex: [
    { id: 'n1', processId: 'P001' },
    { id: 'n2', processId: 'P002' },
  ],
  handoffs: [{ id: 'h1', processId: 'P002', flowId: 'f1', fromActorId: 'a', toActorId: 'b', sourceNodeId: 'n2', targetNodeId: 'n3' }],
} as unknown as FrontendCatalog

it('routes old process, actor and activity entry points to the same operation screen', () => {
  expect(operationEntryHref(catalog, new URLSearchParams())).toBe('/operacao/P001')
  expect(operationEntryHref(catalog, new URLSearchParams('process=P002&activity=n2'))).toBe('/operacao/P002?activity=n2')
  expect(operationEntryHref(catalog, new URLSearchParams('area=b'))).toBe('/operacao/P002?activity=n3')
  expect(operationEntryHref(catalog, new URLSearchParams('activity=n2'))).toBe('/operacao/P002?activity=n2')
  expect(operationEntryHref(catalog, new URLSearchParams('process=P001&diagram=d1'))).toBe('/operacao/P001?diagram=d1')
})

it('marks only documented handoffs on their original process and flow', () => {
  expect(documentedPassages(catalog, 'P002', 'f1').map((item) => item.id)).toEqual(['h1'])
  expect(documentedPassages(catalog, 'P001', 'f1')).toEqual([])
  expect(documentedPassages(catalog, 'P002', 'unmapped')).toEqual([])
})
