import type { FrontendCatalog, ProcessPayload } from './types'

export type JsonLoader = (path: string) => Promise<unknown>

export interface OperationDataClient {
  loadCatalog(): Promise<FrontendCatalog>
  loadProcess(processId: string): Promise<ProcessPayload>
}

export function createOperationDataClient(loadJson: JsonLoader): OperationDataClient {
  let catalog: Promise<FrontendCatalog> | undefined
  const processes = new Map<string, Promise<ProcessPayload>>()

  return {
    loadCatalog() {
      catalog ??= loadJson('/data/catalog.json') as Promise<FrontendCatalog>
      return catalog
    },
    loadProcess(processId) {
      const existing = processes.get(processId)
      if (existing) return existing
      const payload = loadJson(`/data/processes/${encodeURIComponent(processId)}.json`) as Promise<ProcessPayload>
      processes.set(processId, payload)
      return payload
    },
  }
}

async function browserJsonLoader(path: string): Promise<unknown> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`)
  return response.json()
}

export const operationDataClient = createOperationDataClient(browserJsonLoader)
