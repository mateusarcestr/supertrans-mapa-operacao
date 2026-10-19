import { describe, expect, it } from 'vitest'
import { groupChannels } from './resources'
import type { NamedCatalogItem } from './types'

describe('channel presentation', () => {
  it('groups documented spelling variants while preserving every ID and source', () => {
    const names = ['E-mail', 'Email', 'Grupo do Whatsapp', 'Grupo de Whatsapp', 'Whatsapp', 'Outro canal']
    const input: NamedCatalogItem[] = names.map((name, index) => ({
      id: `channel:${index}`,
      name,
      aliases: [name],
      classification: 'channel',
      sources: [{ kind: 'pop', file: `POP/${index}.docx`, row: index + 1 }],
    }))
    const before = JSON.stringify(input)
    const groups = groupChannels(input)
    expect(groups.map((item) => item.name)).toEqual(['E-mail', 'Grupo de WhatsApp', 'WhatsApp', 'Outro canal'])
    expect(groups[0].memberIds).toEqual(['channel:0', 'channel:1'])
    expect(groups[1].memberIds).toEqual(['channel:2', 'channel:3'])
    expect(groups[2].memberIds).toEqual(['channel:4'])
    expect(groups.flatMap((item) => item.sources)).toEqual(input.flatMap((item) => item.sources))
    expect(groups[0].aliases).toEqual(['E-mail', 'Email'])
    expect(groups.find((item) => item.memberIds.includes('channel:3'))?.name).toBe('Grupo de WhatsApp')
    expect(JSON.stringify(input)).toBe(before)
  })
})
