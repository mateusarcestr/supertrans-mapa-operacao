import { describe, expect, it } from 'vitest'

import { findCatalogResults } from './selectors'

const catalog = {
  processes: [
    { id: 'P001', name: 'Importação' },
    { id: 'P009', name: 'Comercial' },
  ],
  actors: [{ id: 'actor:1', name: 'Central de Operações' }],
  systems: [{ id: 'system:1', name: 'Web SAG' }],
  channels: [{ id: 'channel:1', name: 'E-mail' }],
  artifacts: [{ id: 'artifact:1', name: 'Programação.xlsx' }],
  activityIndex: [{ id: 'node:1', processId: 'P001', name: 'Envia solicitação', diagramId: 'diagram:1', type: 'task' }],
}

describe('catalog selectors', () => {
  it('searches processes, actors, systems, channels, and artifacts without graph data', () => {
    expect(findCatalogResults(catalog, 'opera')).toEqual([{ id: 'actor:1', kind: 'actor', label: 'Central de Operações' }])
    expect(findCatalogResults(catalog, 'sag')).toEqual([{ id: 'system:1', kind: 'system', label: 'Web SAG' }])
    expect(findCatalogResults(catalog, 'programação')).toEqual([{ id: 'artifact:1', kind: 'artifact', label: 'Programação.xlsx' }])
  })

  it('keeps the process ID when an activity search result is selected', () => {
    expect(findCatalogResults(catalog, 'solicitação')).toEqual([
      { id: 'node:1', kind: 'activity', label: 'Envia solicitação', processId: 'P001' },
    ])
  })
})
