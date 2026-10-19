import type {
  FrontendCatalog,
  Handoff,
  NamedCatalogItem,
  ProcessSummary,
  ReviewConflict,
  SourceReference,
} from './types'
import type { DataConfidenceState } from './readiness'

export interface OperationalAnswerItem {
  id: string
  kind: 'activity' | 'process' | 'actor' | 'system' | 'channel' | 'artifact' | 'handoff' | 'conflict' | 'decision'
  title: string
  subtitle?: string
  description?: string
  processId?: string
  confidence?: DataConfidenceState
  sources?: SourceReference[]
  action?: {
    type: 'process-activity' | 'process' | 'handoffs' | 'systems' | 'areas' | 'evidence'
    target: string
    label: string
  }
}

export interface OperationalAnswer {
  query: string
  interpretedIntent: 'responsibility' | 'system' | 'handoff' | 'decision' | 'conflict' | 'process' | 'general'
  headline: string
  directAnswer: string
  confidence: DataConfidenceState
  confidenceNote?: string
  items: OperationalAnswerItem[]
  suggestedFollowUps: string[]
  sourcesCount: number
}

export const SUGGESTED_QUESTIONS = [
  {
    category: 'Responsabilidades & Equipes',
    questions: [
      'Quem é responsável pelo transbordo no P002?',
      'Quem faz o agendamento no processo P001?',
      'Quais atividades são atribuídas à equipe Comercial?',
      'Quem cuida da emissão de CTE?',
    ],
  },
  {
    category: 'Sistemas & Ferramentas',
    questions: [
      'Onde o sistema TOTVS é utilizado?',
      'Quais canais de comunicação são usados na operação?',
      'Onde são utilizadas planilhas como artefato?',
      'Qual sistema é usado para manifesto MDF-e?',
    ],
  },
  {
    category: 'Passagens entre Equipes',
    questions: [
      'Quais passagens de bastão envolvem o Comercial?',
      'Como a carga passa para a equipe de Operação?',
      'Quantas passagens entre equipes foram mapeadas no total?',
      'Existem passagens entre Planejamento e Faturamento?',
    ],
  },
  {
    category: 'Decisões & Ramificações',
    questions: [
      'O que acontece se não houver capacidade de atendimento?',
      'Qual o objetivo do processo P001 - Importação?',
      'Existem conflitos ou divergências no processo P005?',
      'Quais subprocessos não foram resolvidos?',
    ],
  },
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function findReferencedProcess(queryNorm: string, processes: ProcessSummary[]): ProcessSummary | undefined {
  // Check for P001..P010 or P1..P10
  const matchCode = queryNorm.match(/\bp0*([1-9]|10)\b/)
  if (matchCode) {
    const num = parseInt(matchCode[1], 10)
    const formatted = `P${String(num).padStart(3, '0')}`
    const found = processes.find((p) => p.id === formatted)
    if (found) return found
  }

  // Check process names
  for (const proc of processes) {
    const nameNorm = normalize(proc.name)
    if (queryNorm.includes(nameNorm)) {
      return proc
    }
  }

  // Check common process keywords
  if (queryNorm.includes('importacao')) return processes.find((p) => p.id === 'P001')
  if (queryNorm.includes('exportacao')) return processes.find((p) => p.id === 'P002')
  if (queryNorm.includes('cabotagem')) return processes.find((p) => p.id === 'P003')
  if (queryNorm.includes('armazem') || queryNorm.includes('armazenagem')) return processes.find((p) => p.id === 'P005')
  if (queryNorm.includes('faturamento')) return processes.find((p) => p.id === 'P006')

  return undefined
}

function findReferencedActor(queryNorm: string, actors: NamedCatalogItem[]): NamedCatalogItem | undefined {
  for (const actor of actors) {
    const actorNorm = normalize(actor.name)
    if (actorNorm.length >= 3 && queryNorm.includes(actorNorm)) {
      return actor
    }
    if (actor.aliases) {
      for (const alias of actor.aliases) {
        const aliasNorm = normalize(alias)
        if (aliasNorm.length >= 3 && queryNorm.includes(aliasNorm)) {
          return actor
        }
      }
    }
  }
  return undefined
}

function findReferencedResource(
  queryNorm: string,
  catalog: FrontendCatalog,
): { item: NamedCatalogItem; kind: 'system' | 'channel' | 'artifact' } | undefined {
  const queryTokens = queryNorm.split(/\s+/).filter((t) => t.length >= 3)

  for (const sys of catalog.systems) {
    const nameNorm = normalize(sys.name)
    if (queryNorm.includes(nameNorm)) {
      return { item: sys, kind: 'system' }
    }
    const sysTokens = nameNorm.split(/\s+/).filter((t) => t.length >= 3)
    if (sysTokens.some((t) => queryTokens.includes(t))) {
      return { item: sys, kind: 'system' }
    }
  }
  for (const ch of catalog.channels) {
    const nameNorm = normalize(ch.name)
    if (queryNorm.includes(nameNorm)) {
      return { item: ch, kind: 'channel' }
    }
    const chTokens = nameNorm.split(/\s+/).filter((t) => t.length >= 3)
    if (chTokens.some((t) => queryTokens.includes(t))) {
      return { item: ch, kind: 'channel' }
    }
  }
  for (const art of catalog.artifacts) {
    const nameNorm = normalize(art.name)
    if (queryNorm.includes(nameNorm)) {
      return { item: art, kind: 'artifact' }
    }
    const artTokens = nameNorm.split(/\s+/).filter((t) => t.length >= 3)
    if (artTokens.some((t) => queryTokens.includes(t))) {
      return { item: art, kind: 'artifact' }
    }
  }
  return undefined
}

export function answerOperationalQuestion(catalog: FrontendCatalog, rawQuery: string): OperationalAnswer {
  const query = rawQuery.trim()
  const queryNorm = normalize(query)

  if (!queryNorm) {
    return {
      query,
      interpretedIntent: 'general',
      headline: 'Central de Dúvidas Operacionais',
      directAnswer:
        'Digite uma dúvida operacional para consultar responsabilidades, sistemas, passagens entre equipes, regras de decisão ou detalhes dos processos Bizagi e POP.',
      confidence: 'READY',
      items: [],
      suggestedFollowUps: [
        'Quem é responsável pelo transbordo no P002?',
        'Onde o sistema TOTVS é utilizado?',
        'O que acontece se não houver capacidade de atendimento?',
        'Quantas passagens entre equipes foram mapeadas?',
      ],
      sourcesCount: 0,
    }
  }

  const referencedProcess = findReferencedProcess(queryNorm, catalog.processes)
  const referencedActor = findReferencedActor(queryNorm, catalog.actors)
  const referencedResource = findReferencedResource(queryNorm, catalog)

  // 1. Intenção: CONFLITO / DIVERGÊNCIA
  const isConflictQuery =
    queryNorm.includes('conflito') ||
    queryNorm.includes('divergencia') ||
    queryNorm.includes('diferenca') ||
    queryNorm.includes('discordancia')

  if (isConflictQuery) {
    const allConflicts = (catalog.conflicts as ReviewConflict[]) ?? []
    const filtered = referencedProcess
      ? allConflicts.filter((c) => c.processId === referencedProcess.id)
      : allConflicts

    const items: OperationalAnswerItem[] = filtered.slice(0, 8).map((c) => ({
      id: c.id,
      kind: 'conflict',
      title: `${c.processId} · Campo ${c.field} (${c.status})`,
      subtitle: `Bizagi: "${c.bizagiValue ?? 'não informado'}" × POP: "${c.popValue ?? 'não informado'}"`,
      description: 'Identificada potencial divergência entre o diagrama Bizagi e o procedimento POP.',
      processId: c.processId,
      confidence: 'READY_WITH_SOURCE_CONFLICT',
      sources: c.sources,
      action: {
        type: 'evidence',
        target: '/documentacao',
        label: 'Ver evidências e fontes',
      },
    }))

    return {
      query,
      interpretedIntent: 'conflict',
      headline: referencedProcess
        ? `Conflitos documentados no processo ${referencedProcess.id}`
        : 'Conflitos e divergências documentadas no modelo',
      directAnswer: referencedProcess
        ? `O processo ${referencedProcess.id} (${referencedProcess.name}) possui ${filtered.length} conflitos ou divergências documentadas entre o Bizagi e o POP que aguardam revisão humana.`
        : `O modelo operacional cataloga ${allConflicts.length} potenciais divergências entre Bizagi e POP. Nenhuma fonte foi sobrescrita silenciosamente; ambas estão preservadas para auditoria.`,
      confidence: 'READY_WITH_SOURCE_CONFLICT',
      confidenceNote: 'Conflitos abertos requerem alinhamento operacional sem escolha arbitrária de fonte.',
      items,
      suggestedFollowUps: [
        'Como acessar a documentação de evidências?',
        'Existem conflitos no processo P001?',
        'Quais subprocessos não foram resolvidos?',
      ],
      sourcesCount: filtered.reduce((acc, c) => acc + (c.sources?.length ?? 0), 0),
    }
  }

  // 2. Intenção: PASSAGEM ENTRE EQUIPES (HANDOFFS)
  const isHandoffQuery =
    queryNorm.includes('passagem') ||
    queryNorm.includes('passagens') ||
    queryNorm.includes('handoff') ||
    queryNorm.includes('handoffs') ||
    queryNorm.includes('passa para') ||
    queryNorm.includes('passa de') ||
    queryNorm.includes('bastao') ||
    queryNorm.includes('transfere')

  if (isHandoffQuery) {
    const allHandoffs = (catalog.handoffs as Handoff[]) ?? []
    let matchedHandoffs = allHandoffs

    if (referencedProcess) {
      matchedHandoffs = matchedHandoffs.filter((h) => h.processId === referencedProcess.id)
    }

    if (referencedActor) {
      matchedHandoffs = matchedHandoffs.filter(
        (h) => h.fromActorId === referencedActor.id || h.toActorId === referencedActor.id,
      )
    }

    const items: OperationalAnswerItem[] = matchedHandoffs.slice(0, 10).map((h) => {
      const fromActor = catalog.actors.find((a) => a.id === h.fromActorId)?.name ?? 'Participante inferido'
      const toActor = catalog.actors.find((a) => a.id === h.toActorId)?.name ?? 'Participante inferido'

      return {
        id: h.id,
        kind: 'handoff',
        title: `${fromActor} → ${toActor}`,
        subtitle: `${h.processId} · ${h.name}`,
        description: h.evidence?.[0] ?? 'Passagem direta identificada por transição entre tarefas de raias distintas.',
        processId: h.processId,
        confidence: 'READY_WITH_INFERENCE_BADGE',
        sources: h.sources,
        action: {
          type: 'handoffs',
          target: `/?process=${encodeURIComponent(h.processId)}`,
          label: 'Ver no mapa de passagens',
        },
      }
    })

    const directAnswer = referencedActor
      ? `Identificamos ${matchedHandoffs.length} passagens de bastão envolvendo a equipe "${referencedActor.name}"${referencedProcess ? ` no processo ${referencedProcess.id}` : ''}. Todas as passagens são derivadas de atribuições inferidas por raias e transições.`
      : referencedProcess
        ? `O processo ${referencedProcess.id} possui ${matchedHandoffs.length} passagens mapeadas entre equipes.`
        : `O catálogo registra ${allHandoffs.length} passagens operacionais mapeadas entre equipes em todos os 10 processos. Todas permanecem classificadas como inferidas até confirmação humana.`

    return {
      query,
      interpretedIntent: 'handoff',
      headline: 'Passagens entre Equipes (Handoffs)',
      directAnswer,
      confidence: 'READY_WITH_INFERENCE_BADGE',
      confidenceNote: 'Todas as 73 passagens do catálogo derivam de atribuições inferidas por geometria de raia.',
      items,
      suggestedFollowUps: [
        'Como ver a matriz de passagens entre equipes?',
        'Quais passagens envolvem a Operação?',
        'Quem é o executor no início do processo P001?',
      ],
      sourcesCount: matchedHandoffs.reduce((acc, h) => acc + (h.sources?.length ?? 0), 0),
    }
  }

  // 3. Intenção: DECISÕES / GATEWAYS / "O que acontece se..."
  const isDecisionQuery =
    queryNorm.includes('o que acontece') ||
    queryNorm.includes('oque acontece') ||
    queryNorm.includes('se ') ||
    queryNorm.includes('caso ') ||
    queryNorm.includes('capacidade') ||
    queryNorm.includes('decisao') ||
    queryNorm.includes('gateway') ||
    queryNorm.includes('ramificacao')

  if (isDecisionQuery) {
    // Buscar no índice de atividades por gateways / decisões relevantes
    let decisionNodes = (catalog.activityIndex ?? []).filter(
      (item) => item.type === 'Route' || item.type.toLowerCase().includes('gateway'),
    )

    if (referencedProcess) {
      decisionNodes = decisionNodes.filter((item) => item.processId === referencedProcess.id)
    }

    // Filtrar por termos se a query especificar algo como "capacidade"
    const terms = queryNorm.split(/\s+/).filter((w) => w.length >= 4 && !['acontece', 'acontecer', 'decisao', 'processo'].includes(w))
    if (terms.length > 0) {
      const filteredByTerms = decisionNodes.filter((node) => {
        const nameNorm = normalize(node.name)
        return terms.some((t) => nameNorm.includes(t))
      })
      if (filteredByTerms.length > 0) {
        decisionNodes = filteredByTerms
      }
    }

    // Se encontramos a decisão de capacidade (famosa no P001/P002)
    const isCapacidade = queryNorm.includes('capacidade')
    let customAnswer = ''
    if (isCapacidade) {
      customAnswer =
        'Na decisão "Possui capacidade de atendimento?" (presente no processo P001 - Importação e P002 - Exportação):\n' +
        '• Se "Não": O fluxo segue para responder a negativa ao solicitante (etapa 5.1 no P001) e finaliza o atendimento sem agendamento.\n' +
        '• Se "Sim": O fluxo avança para "Responde aceitando a solicitação e confirmando a data" (etapa 6 no P001) e inicia a conferência e programação.'
    } else {
      customAnswer = `Encontramos ${decisionNodes.length} pontos de decisão (gateways BPMN)${referencedProcess ? ` no processo ${referencedProcess.id}` : ' nos processos'}. No playback operacional é possível testar cada ramificação real.`
    }

    const items: OperationalAnswerItem[] = decisionNodes.slice(0, 6).map((node) => ({
      id: node.id,
      kind: 'decision',
      title: node.name,
      subtitle: `${node.processId} · Ponto de Decisão (${node.type})`,
      description: 'Gateway com saídas condicionais documentadas no Bizagi.',
      processId: node.processId,
      confidence: 'READY',
      action: {
        type: 'process-activity',
        target: `/processos/${node.processId}?activity=${encodeURIComponent(node.id)}`,
        label: 'Ver decisão no diagrama 2D',
      },
    }))

    return {
      query,
      interpretedIntent: 'decision',
      headline: isCapacidade ? 'Decisão: Capacidade de Atendimento' : 'Decisões e Ramificações Operacionais',
      directAnswer: customAnswer,
      confidence: 'READY',
      items,
      suggestedFollowUps: [
        'Como funciona o playback de processos?',
        'Quem é responsável pelo agendamento no P001?',
        'Quais sistemas são usados no P001?',
      ],
      sourcesCount: decisionNodes.length,
    }
  }

  // 4. Intenção: SISTEMAS / RECURSOS / CANAIS / ARTEFATOS
  const isSystemQuery =
    Boolean(referencedResource) ||
    queryNorm.includes('sistema') ||
    queryNorm.includes('sistemas') ||
    queryNorm.includes('ferramenta') ||
    queryNorm.includes('canal') ||
    queryNorm.includes('canais') ||
    queryNorm.includes('artefato') ||
    queryNorm.includes('artefatos') ||
    queryNorm.includes('planilha') ||
    queryNorm.includes('whatsapp') ||
    queryNorm.includes('email') ||
    queryNorm.includes('totvs') ||
    queryNorm.includes('protheus')

  if (isSystemQuery) {
    if (referencedResource) {
      const res = referencedResource.item
      const kindLabel =
        referencedResource.kind === 'system'
          ? 'Sistema'
          : referencedResource.kind === 'channel'
            ? 'Canal de Comunicação'
            : 'Artefato Documental'

      const items: OperationalAnswerItem[] = [
        {
          id: res.id,
          kind: referencedResource.kind,
          title: res.name,
          subtitle: `${kindLabel} · Classificação: ${res.classification ?? 'homologado'}`,
          description: `Referenciado oficialmente nas descrições de procedimentos POP e anotações Bizagi.`,
          confidence: 'READY',
          sources: res.sources,
          action: {
            type: 'systems',
            target: '/sistemas',
            label: 'Ver todos os recursos',
          },
        },
      ]

      return {
        query,
        interpretedIntent: 'system',
        headline: `${kindLabel}: ${res.name}`,
        directAnswer: `O recurso "${res.name}" está catalogado como ${kindLabel.toLowerCase()} oficial da operação Super Trans, com ${res.sources.length} referências diretas nos documentos POP.`,
        confidence: 'READY',
        items,
        suggestedFollowUps: [
          'Quais outros sistemas são utilizados na operação?',
          'Onde são utilizadas planilhas?',
          'Quais canais de comunicação com o cliente são registrados?',
        ],
        sourcesCount: res.sources.length,
      }
    }

    // Listagem geral de sistemas
    const items: OperationalAnswerItem[] = [
      ...catalog.systems.map((s) => ({
        id: s.id,
        kind: 'system' as const,
        title: s.name,
        subtitle: 'Sistema / Software Operacional',
        description: `${s.sources.length} referências em documentos POP.`,
        confidence: 'READY' as const,
        sources: s.sources,
        action: { type: 'systems' as const, target: '/sistemas', label: 'Consultar no catálogo' },
      })),
      ...catalog.channels.map((c) => ({
        id: c.id,
        kind: 'channel' as const,
        title: c.name,
        subtitle: 'Canal de Comunicação',
        description: 'Meio utilizado para troca de informações operacionais.',
        confidence: 'READY' as const,
        sources: c.sources,
      })),
    ].slice(0, 8)

    return {
      query,
      interpretedIntent: 'system',
      headline: 'Sistemas e Recursos da Operação',
      directAnswer: `A operação Super Trans conta com ${catalog.systems.length} sistemas (incluindo TOTVS/Protheus e softwares especializados), ${catalog.channels.length} canais de comunicação (como E-mail e WhatsApp) e ${catalog.artifacts.length} artefatos catalogados.`,
      confidence: 'READY',
      items,
      suggestedFollowUps: [
        'Onde o sistema TOTVS é utilizado?',
        'Quem opera o sistema de agendamento?',
        'Quais artefatos são usados no P001?',
      ],
      sourcesCount: catalog.systems.length + catalog.channels.length,
    }
  }

  // 5. Intenção: RESPONSABILIDADE / "QUEM FAZ" / EQUIPES
  const isResponsibilityQuery =
    queryNorm.includes('quem') ||
    queryNorm.includes('responsavel') ||
    queryNorm.includes('responsabilidade') ||
    queryNorm.includes('quem faz') ||
    queryNorm.includes('qual equipe') ||
    queryNorm.includes('quem executa') ||
    queryNorm.includes('papel') ||
    queryNorm.includes('funcao') ||
    Boolean(referencedActor)

  if (isResponsibilityQuery) {
    if (referencedActor) {
      // Buscar atividades atribuídas ou relacionadas a este ator
      const actorId = referencedActor.id
      const handoffsFromOrTo = (catalog.handoffs as Handoff[]).filter(
        (h) => h.fromActorId === actorId || h.toActorId === actorId,
      )

      const items: OperationalAnswerItem[] = [
        {
          id: referencedActor.id,
          kind: 'actor',
          title: referencedActor.name,
          subtitle: `Participante Operacional · ${handoffsFromOrTo.length} passagens de bastão`,
          description: `Identificado em procedimentos POP e nas raias dos diagramas Bizagi.`,
          confidence: 'READY_WITH_INFERENCE_BADGE',
          sources: referencedActor.sources,
          action: {
            type: 'areas',
            target: '/areas',
            label: 'Ver equipe em Equipes e Responsabilidades',
          },
        },
        ...handoffsFromOrTo.slice(0, 4).map((h) => ({
          id: h.id,
          kind: 'handoff' as const,
          title: h.name,
          subtitle: `${h.processId} · Passagem de equipe`,
          description: 'Passagem entre raias derivada do cruzamento de transições Bizagi e executores POP.',
          processId: h.processId,
          confidence: 'READY_WITH_INFERENCE_BADGE' as const,
          sources: h.sources,
          action: {
            type: 'handoffs' as const,
            target: `/?process=${h.processId}`,
            label: 'Ver passagem',
          },
        })),
      ]

      return {
        query,
        interpretedIntent: 'responsibility',
        headline: `Equipe: ${referencedActor.name}`,
        directAnswer: `A equipe "${referencedActor.name}" participa de operações documentadas no modelo, estando envolvida em ${handoffsFromOrTo.length} passagens de bastão com outras áreas. As atribuições originárias de raias geométricas do Bizagi permanecem sinalizadas como inferidas.`,
        confidence: 'READY_WITH_INFERENCE_BADGE',
        confidenceNote: 'Atribuições derivadas de raias geométricas Bizagi não constituem confirmação jurídica/operacional definitiva.',
        items,
        suggestedFollowUps: [
          `Quais passagens de bastão envolvem ${referencedActor.name}?`,
          'Quem é responsável pelo transbordo no P002?',
          'Como ver o mapa de equipes?',
        ],
        sourcesCount: referencedActor.sources.length,
      }
    }

    // Se perguntou "quem faz X", buscar a atividade específica
    const cleanedSearch = queryNorm
      .replace(/\b(quem|faz|e|o|a|os|as|um|uma|responsavel|pelo|pela|por|qual|equipe|executa|no|na|do|da|de|em|processo)\b/gu, ' ')
      .replace(/\bp0*([1-9]|10)\b/gu, ' ')
      .trim()

    const searchTokens = cleanedSearch.split(/\s+/).filter((w) => w.length >= 3)

    const matches = (catalog.activityIndex ?? []).filter((item) => {
      const nameNorm = normalize(item.name)
      if (referencedProcess && item.processId !== referencedProcess.id) return false
      if (searchTokens.length === 0) return true
      return searchTokens.some((t) => nameNorm.includes(t))
    })

    if (matches.length > 0) {
      const best = matches[0]
      const proc = catalog.processes.find((p) => p.id === best.processId)

      const items: OperationalAnswerItem[] = matches.slice(0, 6).map((act) => ({
        id: act.id,
        kind: 'activity',
        title: act.name,
        subtitle: `${act.processId} · ${act.type} (Status: ${act.reconciliationStatus ?? 'reconciliado'})`,
        description: `Etapa documentada no processo ${act.processId} (${proc?.name ?? 'Processo'}).`,
        processId: act.processId,
        confidence: 'READY_WITH_INFERENCE_BADGE',
        action: {
          type: 'process-activity',
          target: `/processos/${act.processId}?activity=${encodeURIComponent(act.id)}`,
          label: 'Ver no diagrama 2D',
        },
      }))

      return {
        query,
        interpretedIntent: 'responsibility',
        headline: `Responsabilidade: ${best.name}`,
        directAnswer: `A atividade "${best.name}" é executada no processo ${best.processId} (${proc?.name ?? ''}). A atribuição de executor foi mapeada a partir da raia Bizagi e do descritivo POP correspondente.`,
        confidence: 'READY_WITH_INFERENCE_BADGE',
        confidenceNote: 'A responsabilidade por raia geométrica é indicada com badge Inferido até confirmação humana.',
        items,
        suggestedFollowUps: [
          `Ver o fluxo completo do processo ${best.processId}`,
          'Quais sistemas são utilizados nessa etapa?',
          'Existem passagens de bastão nesse processo?',
        ],
        sourcesCount: matches.length,
      }
    }
  }

  // 6. Intenção: INFORMAÇÕES DE PROCESSO
  if (referencedProcess) {
    const proc = referencedProcess
    const procHandoffs = (catalog.handoffs as Handoff[]).filter((h) => h.processId === proc.id)
    const procConflicts = (catalog.conflicts as ReviewConflict[]).filter((c) => c.processId === proc.id)

    const items: OperationalAnswerItem[] = [
      {
        id: proc.id,
        kind: 'process',
        title: `${proc.id} · ${proc.name}`,
        subtitle: `Objetivo: ${proc.objective ?? 'Operação documentada em POP e Bizagi'}`,
        description: `${proc.nodeCount} nós, ${proc.flowCount} fluxos, ${proc.diagramCount} diagrama(s), ${procHandoffs.length} passagens de bastão e ${procConflicts.length} conflitos sob revisão.`,
        processId: proc.id,
        confidence: proc.conflictCount > 0 ? 'READY_WITH_SOURCE_CONFLICT' : 'READY',
        sources: proc.sources,
        action: {
          type: 'process',
          target: `/processos/${proc.id}`,
          label: 'Abrir processo e playback',
        },
      },
    ]

    return {
      query,
      interpretedIntent: 'process',
      headline: `Processo ${proc.id} · ${proc.name}`,
      directAnswer: `O processo ${proc.id} (${proc.name}) tem como objetivo oficial: "${proc.objective ?? 'Operação Supertrans'}". Ele é composto por ${proc.nodeCount} elementos de fluxo, ${proc.diagramCount} diagrama(s) no Bizagi e ${procHandoffs.length} passagens entre equipes.`,
      confidence: proc.conflictCount > 0 ? 'READY_WITH_SOURCE_CONFLICT' : 'READY',
      items,
      suggestedFollowUps: [
        `Quais as passagens de bastão no ${proc.id}?`,
        `Existem decisões ou gateways no ${proc.id}?`,
        `Ver diagrama 2D do ${proc.id}`,
      ],
      sourcesCount: proc.sources.length,
    }
  }

  // 7. BUSCA GERAL PONDERADA (FALLBACK INTELIGENTE)
  const searchKeywords = queryNorm.split(/\s+/).filter((w) => w.length >= 3)
  const matchedActivities = (catalog.activityIndex ?? [])
    .filter((act) => {
      const nameNorm = normalize(act.name)
      return searchKeywords.some((kw) => nameNorm.includes(kw))
    })
    .slice(0, 5)

  const matchedActors = catalog.actors
    .filter((a) => {
      const nameNorm = normalize(a.name)
      return searchKeywords.some((kw) => nameNorm.includes(kw))
    })
    .slice(0, 3)

  const matchedSystems = catalog.systems
    .filter((s) => {
      const nameNorm = normalize(s.name)
      return searchKeywords.some((kw) => nameNorm.includes(kw))
    })
    .slice(0, 3)

  const matchedHandoffs = (catalog.handoffs as Handoff[])
    .filter((h) => {
      const nameNorm = normalize(h.name)
      return searchKeywords.some((kw) => nameNorm.includes(kw))
    })
    .slice(0, 3)

  const items: OperationalAnswerItem[] = [
    ...matchedActivities.map((act) => ({
      id: act.id,
      kind: 'activity' as const,
      title: act.name,
      subtitle: `Atividade no processo ${act.processId}`,
      processId: act.processId,
      confidence: 'READY' as const,
      action: {
        type: 'process-activity' as const,
        target: `/processos/${act.processId}?activity=${encodeURIComponent(act.id)}`,
        label: 'Ver no diagrama',
      },
    })),
    ...matchedActors.map((actor) => ({
      id: actor.id,
      kind: 'actor' as const,
      title: actor.name,
      subtitle: 'Equipe / Participante',
      confidence: 'READY_WITH_INFERENCE_BADGE' as const,
      sources: actor.sources,
      action: {
        type: 'areas' as const,
        target: '/areas',
        label: 'Ver equipe',
      },
    })),
    ...matchedSystems.map((sys) => ({
      id: sys.id,
      kind: 'system' as const,
      title: sys.name,
      subtitle: 'Sistema homologado',
      confidence: 'READY' as const,
      sources: sys.sources,
      action: {
        type: 'systems' as const,
        target: '/sistemas',
        label: 'Ver recursos',
      },
    })),
    ...matchedHandoffs.map((h) => ({
      id: h.id,
      kind: 'handoff' as const,
      title: h.name,
      subtitle: `Passagem no processo ${h.processId}`,
      processId: h.processId,
      confidence: 'READY_WITH_INFERENCE_BADGE' as const,
      sources: h.sources,
      action: {
        type: 'handoffs' as const,
        target: `/?process=${h.processId}`,
        label: 'Ver passagem',
      },
    })),
  ]

  const totalResults = items.length
  return {
    query,
    interpretedIntent: 'general',
    headline: totalResults > 0 ? `Resultados operacionais para "${query}"` : `Nenhum resultado direto para "${query}"`,
    directAnswer:
      totalResults > 0
        ? `Localizamos ${totalResults} elemento(s) no modelo canônico correspondente(s) aos termos pesquisados.`
        : `Não encontramos correspondência exata para "${query}". Tente buscar por um processo (ex: P001), equipe (ex: Comercial), sistema (ex: TOTVS) ou atividade (ex: agendamento).`,
    confidence: totalResults > 0 ? 'READY' : 'NOT_AVAILABLE',
    items,
    suggestedFollowUps: [
      'Quem é responsável pelo transbordo no P002?',
      'O que acontece se não houver capacidade de atendimento?',
      'Onde o sistema TOTVS é utilizado?',
      'Quais passagens de bastão foram mapeadas?',
    ],
    sourcesCount: items.reduce((acc, it) => acc + (it.sources?.length ?? 0), 0),
  }
}
