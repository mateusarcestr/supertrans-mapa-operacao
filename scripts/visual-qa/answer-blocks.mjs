import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const output = new URL('../../docs/screenshots/answer-blocks/', import.meta.url)
await mkdir(output, { recursive: true })
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4174'
// Synthetic reply only: no operational documents leave this machine.
const reply = {
  mode: 'nvidia-api', externalContext: true, answer: 'A importação vai da solicitação do cliente até a entrega do contêiner cheio. [1]',
  sources: [{ id: 'processes/P001.md:3:0', file: 'processes/P001.md', line: 3, title: 'Visão geral', quote: 'Objetivo: descrever o processo.', processId: 'P001' }],
  blocks: [
    { type: 'highlight', title: 'Em poucas palavras', text: 'Descreve e detalha o processo de importação na Super Trans.', sources: [1] },
    { type: 'cards', title: 'Quem participa', sources: [1], items: [{ title: 'Comercial', text: 'Recebe e aceita a demanda.', label: 'E-mail' }, { title: 'Central de Operações', text: 'Programa a retirada.', label: 'Whatsapp' }, { title: 'Motoristas', text: 'Executam o transporte.' }] },
    { type: 'table', title: 'Áreas', sources: [1], columns: ['Internas', 'Externas'], rows: [['Comercial', 'Cliente / Importador'], ['Pátio C', 'Porto e Depot']] },
    { type: 'chips', title: 'Sistemas', sources: [1], items: ['Portal', 'Excel', 'E-mail'] },
  ],
}
const browser = await chromium.launch({ headless: true })
try {
  for (const [theme, width, height] of [['dark', 1366, 900], ['light', 1366, 900], ['light', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/chat/status') return route.fulfill({ json: { mode: 'nvidia-api', externalContext: true } })
      if (url.pathname === '/api/chat/settings') return route.fulfill({ json: { model: 'openai/gpt-oss-20b', keyConfigured: true, locked: false, mode: 'nvidia-api', externalContext: true } })
      if (url.pathname === '/api/chat') return route.fulfill({ json: reply })
      return route.abort()
    })
    await page.goto(base + '/')
    await page.evaluate(theme => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.getByRole('textbox', { name: 'Sua pergunta sobre o processo' }).fill('Resuma a importação')
    await page.getByRole('button', { name: 'Enviar pergunta' }).click()
    await page.locator('.answer-blocks').waitFor()
    assert.equal(await page.locator('.answer-block').count(), 4)
    assert.equal(await page.locator('.answer-cards li').count(), 3)
    assert.equal(await page.locator('.answer-table tbody tr').count(), 2)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await page.locator('.assistant-turn').screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)) })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log('answer-blocks QA OK')
