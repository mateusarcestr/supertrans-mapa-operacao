import type { NamedCatalogItem } from './types'

export interface ResourceGroup extends NamedCatalogItem {
  memberIds: string[]
}

// Presentation aliases only. Canonical records and their references stay intact.
export function groupChannels(items: NamedCatalogItem[]): ResourceGroup[] {
  const groups = new Map<string, ResourceGroup>()
  for (const item of items) {
    const label = item.name.normalize('NFKC').trim().toLowerCase()
    const name = /^(e-mail|email)$/.test(label) ? 'E-mail'
      : /^grupo (de|do) whatsapp$/.test(label) ? 'Grupo de WhatsApp'
      : label === 'whatsapp' ? 'WhatsApp' : item.name
    const key = ['E-mail', 'Grupo de WhatsApp', 'WhatsApp'].includes(name) ? name : item.id
    const existing = groups.get(key)
    if (existing) {
      existing.memberIds.push(item.id)
      existing.sources.push(...item.sources)
      existing.aliases = [...new Set([...existing.aliases ?? [], item.name, ...item.aliases ?? []])]
    } else {
      groups.set(key, { ...item, name, memberIds: [item.id], sources: [...item.sources], aliases: [...new Set([item.name, ...item.aliases ?? []])] })
    }
  }
  return [...groups.values()]
}
