import { describe, expect, it } from 'vitest'
import { buildChatPayload } from './chatPayload'

describe('buildChatPayload', () => {
  it('keeps a follow-up after a response with 121 sources within the server limit', () => {
    const sources = Array.from({ length: 121 }, (_, index) => ({
      id: `P001:source:${index}`,
      quote: 'Trecho documental extenso. '.repeat(20),
    }))
    const payload = buildChatPayload('Quantas etapas tem aqui nessa operação?', 'P001', 'nvidia/model', 'standard', [
      { question: 'Quem executa as etapas deste processo?', reply: { answer: 'Resposta extensa', sources } },
    ])

    expect(payload.history).toEqual({
      question: 'Quem executa as etapas deste processo?',
      sources: sources.map(({ id }) => ({ id })),
    })
    expect(new TextEncoder().encode(JSON.stringify(payload)).length).toBeLessThanOrEqual(12000)
  })

  it('uses the last successful response when retrying and bounds a very large history', () => {
    const payload = buildChatPayload('Explique essa etapa', 'P001', undefined, undefined, [
      { question: 'Pergunta anterior', reply: { answer: 'Resposta', sources: Array.from({ length: 300 }, (_, index) => ({ id: `P001:${index}:${'x'.repeat(60)}` })) } },
      { question: 'Explique essa etapa', error: 'Falha HTTP' },
    ])

    expect(payload.history?.question).toBe('Pergunta anterior')
    expect(payload.history?.sources.length).toBeLessThan(300)
    expect(new TextEncoder().encode(JSON.stringify(payload)).length).toBeLessThanOrEqual(12000)
  })
})
