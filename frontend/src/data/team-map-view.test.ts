import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { TeamMapPage } from '../components/TeamMapPage'
import type { FrontendCatalog } from './types'

it('shows the team network without an expanded delivery list on initial view', () => {
  const catalog = {
    processes: [{ id: 'P001', name: 'Importação' }],
    actors: [
      { id: 'a', name: 'Comercial' },
      { id: 'b', name: 'Operações' },
    ],
    handoffs: [
      {
        id: 'h',
        processId: 'P001',
        fromActorId: 'a',
        toActorId: 'b',
        name: '3. Envia → 4. Recebe',
        sourceNodeId: 's',
        targetNodeId: 't',
        flowId: 'f',
        classification: 'inferred',
        sources: [],
      },
    ],
  } as unknown as FrontendCatalog
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(TeamMapPage, { catalog })))
  expect(html).toContain('team-map-network')
  expect(html).toContain('Entregam para esta equipe')
  expect(html).toContain('Recebem desta equipe')
  expect(html).not.toContain('data-handoff-id=')
  expect(html).not.toContain('3. Envia')
})
