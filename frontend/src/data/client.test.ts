import { describe, expect, it, vi } from 'vitest'

import { createOperationDataClient } from './client'

describe('operation data client', () => {
  it('loads the compact catalog before a requested process payload', async () => {
    const loadJson = vi.fn(async (path: string) => ({ path }))
    const client = createOperationDataClient(loadJson)

    await expect(client.loadCatalog()).resolves.toEqual({ path: '/data/catalog.json' })
    await expect(client.loadProcess('P001')).resolves.toEqual({ path: '/data/processes/P001.json' })
    expect(loadJson).toHaveBeenNthCalledWith(1, '/data/catalog.json')
    expect(loadJson).toHaveBeenNthCalledWith(2, '/data/processes/P001.json')
  })

  it('caches a process payload by canonical process ID', async () => {
    const loadJson = vi.fn(async (path: string) => ({ path }))
    const client = createOperationDataClient(loadJson)

    await Promise.all([client.loadProcess('P005'), client.loadProcess('P005')])

    expect(loadJson).toHaveBeenCalledTimes(1)
    expect(loadJson).toHaveBeenCalledWith('/data/processes/P005.json')
  })
})
