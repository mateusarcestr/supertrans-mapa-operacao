import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const output = new URL('../../docs/screenshots/handoff-reading/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const [theme, width, height] of [['dark', 1366, 768], ['light', 1024, 768], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:4174/')
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.locator('.handoff-reading-card').first().waitFor()
    assert.equal(await page.locator('.handoff-reading-card').count(), 73)
    assert.equal(await page.locator('.handoff-process-group').count(), 10)
    assert.ok((await page.locator('.handoff-overview-note').textContent()).includes('Procedimentos Operacionais Padrão'))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const first = page.locator('.handoff-process-group').first()
    const sources = await first.locator('.handoff-card-activities > div:first-child a').allTextContents()
    assert.deepEqual(sources, [...sources].sort(new Intl.Collator('pt-BR', { numeric: true }).compare))
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)) })
    await first.evaluate((element) => element.scrollIntoView({ block: 'start' }))
    await page.screenshot({ path: fileURLToPath(new URL(`cards-${theme}-${width}.png`, output)) })
  }
  const processFilter = page.locator('.handoff-filters label').filter({ hasText: 'Processo' }).locator('select')
  await processFilter.selectOption('P002')
  assert.equal(await page.locator('.handoff-reading-card').count(), 8)
  assert.equal(await page.locator('.handoff-process-group').count(), 1)
  await page.getByText('Ver evidências', { exact: true }).first().click()
  assert.equal(await page.locator('.handoff-evidence[open]').count(), 1)
  assert.ok((await page.locator('.handoff-evidence[open]').textContent()).includes('POP/'))
  await processFilter.selectOption('')
  const search = page.getByPlaceholder('Processo ou atividade')
  await search.fill('zzzz-no-match')
  await page.getByText('Nenhuma passagem encontrada com os filtros atuais.').waitFor()
  await search.fill('')
  assert.equal(await page.locator('.handoff-reading-card').count(), 73)
  await page.getByRole('button', { name: 'Matriz', exact: true }).click()
  await page.locator('.handoff-matrix').waitFor()
  assert.deepEqual(errors, [])
  console.log('QA passed: 73 cards/10 processes, activity order, POP definition, three viewports, filters, evidence, empty state and matrix; no overflow or page errors.')
} finally {
  await browser.close()
}
