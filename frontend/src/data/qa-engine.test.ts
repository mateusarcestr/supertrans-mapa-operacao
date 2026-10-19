import { describe, expect, it } from 'vitest'
import { answerOperationalQuestion } from './qa-engine'
import type { FrontendCatalog } from './types'

const sampleCatalog: FrontendCatalog = {
  schemaVersion: '1.0',
  sourcePolicy: ['bizagi', 'pop'],
  summary: {
    processes: 2,
    diagrams: 2,
    nodes: 10,
    flows: 10,
    conflicts: 1,
    unresolvedSubflows: 0,
  },
  processes: [
    {
      id: 'P001',
      name: 'Importação',
      objective: 'Realizar a importação de contêineres.',
      diagramCount: 1,
      nodeCount: 5,
      flowCount: 5,
      nodeTypes: { Task: 4, Route: 1 },
      reconciliation: { matched: 4 },
      unresolvedSubflowCount: 0,
      actorCount: 2,
      systemCount: 1,
      channelCount: 1,
      artifactCount: 1,
      handoffCount: 1,
      conflictCount: 0,
      sources: [
        {
          file: 'Processos em bpm/0001 - IMPORTAÇÃO.bpm.zip',
          kind: 'bizagi',
          member: 'Diagram.xml',
        },
      ],
    },
    {
      id: 'P002',
      name: 'Exportação',
      objective: 'Realizar a exportação com transbordo.',
      diagramCount: 1,
      nodeCount: 5,
      flowCount: 5,
      nodeTypes: { Task: 5 },
      reconciliation: { matched: 5 },
      unresolvedSubflowCount: 0,
      actorCount: 2,
      systemCount: 1,
      channelCount: 0,
      artifactCount: 0,
      handoffCount: 0,
      conflictCount: 1,
      sources: [
        {
          file: 'Processos em bpm/0002 - EXPORTAÇÃO.bpm.zip',
          kind: 'bizagi',
          member: 'Diagram.xml',
        },
      ],
    },
  ],
  actors: [
    {
      id: 'actor:comercial',
      name: 'Comercial',
      aliases: ['Setor Comercial'],
      sources: [{ file: 'POP/POP-0001 - IMPORTAÇÃO.docx', kind: 'pop' }],
    },
    {
      id: 'actor:operacao',
      name: 'Operação',
      aliases: ['Central de Operações'],
      sources: [{ file: 'POP/POP-0001 - IMPORTAÇÃO.docx', kind: 'pop' }],
    },
  ],
  systems: [
    {
      id: 'system:totvs',
      name: 'TOTVS Protheus',
      sources: [{ file: 'POP/POP-0001 - IMPORTAÇÃO.docx', kind: 'pop' }],
    },
  ],
  channels: [
    {
      id: 'channel:email',
      name: 'E-mail',
      sources: [{ file: 'POP/POP-0001 - IMPORTAÇÃO.docx', kind: 'pop' }],
    },
  ],
  artifacts: [
    {
      id: 'artifact:cte',
      name: 'Conhecimento de Transporte (CT-e)',
      sources: [{ file: 'POP/POP-0001 - IMPORTAÇÃO.docx', kind: 'pop' }],
    },
  ],
  activityIndex: [
    {
      id: 'node:agendamento',
      processId: 'P001',
      diagramId: 'diagram:1',
      name: 'Realiza agendamento no porto',
      type: 'Task',
    },
    {
      id: 'node:transbordo',
      processId: 'P002',
      diagramId: 'diagram:2',
      name: 'Realiza transbordo de carga',
      type: 'Task',
    },
    {
      id: 'node:capacidade',
      processId: 'P001',
      diagramId: 'diagram:1',
      name: 'Possui capacidade de atendimento?',
      type: 'Route',
    },
  ],
  handoffs: [
    {
      id: 'handoff:1',
      processId: 'P001',
      name: 'Realiza agendamento → Confirma agendamento',
      fromActorId: 'actor:comercial',
      toActorId: 'actor:operacao',
      sourceNodeId: 'node:agendamento',
      targetNodeId: 'node:confirma',
      flowId: 'flow:1',
      classification: 'inferred',
      sources: [{ file: 'Processos em bpm/0001 - IMPORTAÇÃO.bpm.zip', kind: 'bizagi' }],
    },
  ],
  conflicts: [
    {
      id: 'conflict:1',
      processId: 'P002',
      field: 'description',
      bizagiValue: 'Realiza transbordo',
      popValue: 'Realiza transbordo conforme procedimento A-12',
      status: 'needs-review',
      entityIds: ['node:transbordo'],
      sources: [{ file: 'Processos em bpm/0002 - EXPORTAÇÃO.bpm.zip', kind: 'bizagi' }],
    },
  ],
  relationships: [],
  diagnostics: [],
}

describe('answerOperationalQuestion', () => {
  it('returns initial welcoming state with suggestions on empty query', () => {
    const res = answerOperationalQuestion(sampleCatalog, '')
    expect(res.headline).toBe('Central de Dúvidas Operacionais')
    expect(res.interpretedIntent).toBe('general')
    expect(res.suggestedFollowUps.length).toBeGreaterThan(0)
  })

  it('answers questions about responsibility citing actor and process', () => {
    const res = answerOperationalQuestion(sampleCatalog, 'Quem é responsável pelo transbordo no P002?')
    expect(res.interpretedIntent).toBe('responsibility')
    expect(res.directAnswer).toContain('P002')
    expect(res.items.some((i) => i.title.includes('transbordo'))).toBe(true)
    expect(res.confidence).toBe('READY_WITH_INFERENCE_BADGE')
  })

  it('answers questions about handoffs citing teams and inference badge', () => {
    const res = answerOperationalQuestion(sampleCatalog, 'Quais passagens de bastão envolvem o Comercial?')
    expect(res.interpretedIntent).toBe('handoff')
    expect(res.directAnswer).toContain('Comercial')
    expect(res.confidenceNote).toContain('inferidas')
    expect(res.items.length).toBeGreaterThan(0)
  })

  it('answers questions about decisions with condition outcomes', () => {
    const res = answerOperationalQuestion(sampleCatalog, 'O que acontece se não houver capacidade de atendimento?')
    expect(res.interpretedIntent).toBe('decision')
    expect(res.directAnswer).toContain('Possui capacidade de atendimento?')
    expect(res.directAnswer).toContain('Se "Não"')
    expect(res.directAnswer).toContain('Se "Sim"')
    expect(res.items.some((i) => i.id === 'node:capacidade')).toBe(true)
  })

  it('answers questions about systems and resources', () => {
    const res = answerOperationalQuestion(sampleCatalog, 'Onde o sistema TOTVS é utilizado?')
    expect(res.interpretedIntent).toBe('system')
    expect(res.directAnswer).toContain('TOTVS Protheus')
    expect(res.items[0].kind).toBe('system')
  })

  it('answers questions about conflicts preserving both sources without choosing silently', () => {
    const res = answerOperationalQuestion(sampleCatalog, 'Existem conflitos no processo P002?')
    expect(res.interpretedIntent).toBe('conflict')
    expect(res.directAnswer).toContain('1 conflitos')
    expect(res.confidence).toBe('READY_WITH_SOURCE_CONFLICT')
    expect(res.items[0].subtitle).toContain('Bizagi')
    expect(res.items[0].subtitle).toContain('POP')
  })
})
