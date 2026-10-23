export interface NamedCatalogItem {
  id: string
  name: string
}

export interface CatalogSearchSource {
  processes: NamedCatalogItem[]
  actors: NamedCatalogItem[]
  systems: NamedCatalogItem[]
  channels: NamedCatalogItem[]
  artifacts: NamedCatalogItem[]
  activityIndex?: Array<NamedCatalogItem & { processId: string }>
}

export type CatalogResultKind = 'process' | 'activity' | 'actor' | 'system' | 'channel' | 'artifact'

export interface CatalogResult {
  id: string
  kind: CatalogResultKind
  label: string
  processId?: string
}

function searchable(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function findCatalogResults(catalog: CatalogSearchSource, query: string): CatalogResult[] {
  const normalizedQuery = searchable(query)
  if (!normalizedQuery) return []

  const groups: Array<[CatalogResultKind, Array<NamedCatalogItem & { processId?: string }>]> = [
    ['process', catalog.processes],
    ['activity', catalog.activityIndex ?? []],
    ['actor', catalog.actors],
    ['system', catalog.systems],
    ['channel', catalog.channels],
    ['artifact', catalog.artifacts],
  ]

  return groups.flatMap(([kind, items]) =>
    items
      .filter((item) => searchable(item.name).includes(normalizedQuery))
      .map((item) => ({
        id: item.id,
        kind,
        label: item.name,
        ...(item.processId ? { processId: item.processId } : {}),
      })),
  )
}
