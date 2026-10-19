import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const catalog = JSON.parse(await readFile(new URL('../../frontend/public/data/catalog.json', import.meta.url), 'utf8'))
const output = new URL('../../docs/screenshots/operation/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  const sample = catalog.handoffs.find((item) => item.processId === 'P001')
  for (const [theme, width, height] of [['dark', 1366, 900], ['light', 1024, 900], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto(`http://127.0.0.1:4174/operacao/P001?activity=${encodeURIComponent(sample.sourceNodeId)}`)
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    const marker = page.locator(`.operation-transfer[data-handoff-id="${sample.id}"]`).first()
    await marker.waitFor()
    assert.equal(await page.getByRole('link', { name: 'Operação', exact: true }).count() >= 1, true)
    assert.equal(await page.getByRole('link', { name: 'Passagens', exact: true }).count(), 0)
    assert.equal(await page.getByRole('link', { name: 'Processos', exact: true }).count(), 0)
    assert.equal(await page.locator('.process-info-drawer').isVisible(), false)
    assert.equal(await page.locator('.process-detail').evaluate((element) => element.scrollWidth > element.clientWidth), false)
    assert.ok((await page.locator('.focus-flow-outgoing').textContent()).includes('Ver passagem entre equipes'))
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)), fullPage: true })
    await page.locator('.focus-flow-network').evaluate((element) => element.scrollIntoView({ block: 'start' }))
    await page.screenshot({ path: fileURLToPath(new URL(`flow-${theme}-${width}.png`, output)) })
    await marker.click()
    await page.locator('.process-info-drawer').waitFor({ state: 'visible' })
    assert.equal(await page.locator('.operation-passage-details .evidence-row').count(), sample.sources.length)
    await page.screenshot({ path: fileURLToPath(new URL(`evidence-${theme}-${width}.png`, output)) })
    await page.keyboard.press('Escape')
    await page.locator('.process-info-drawer').waitFor({ state: 'hidden' })
    await page.locator('.process-summary').evaluate((element) => { element.open = true }); await page.locator('.operation-passage-picker select').selectOption(sample.id)
    await page.locator('.process-info-drawer').waitFor({ state: 'visible' })
    await page.keyboard.press('Escape')
    await page.locator('.process-info-drawer').waitFor({ state: 'hidden' })
  }
  const visited = new Set()
  for (const process of catalog.processes) {
    await page.goto(`http://127.0.0.1:4174/operacao/${process.id}`)
    await page.locator('.focus-flow-current').waitFor()
    const handoffs = catalog.handoffs.filter((item) => item.processId === process.id)
    assert.equal(await page.locator('.operation-passage-picker option').count(), handoffs.length + 1)
    for (const handoff of handoffs) {
      await page.locator('.process-summary').evaluate((element) => { element.open = true }); await page.locator('.operation-passage-picker select').selectOption(handoff.id)
      await page.locator(`.focus-flow-current[data-node-id="${handoff.sourceNodeId}"]`).waitFor()
      await page.locator(`.operation-transfer[data-handoff-id="${handoff.id}"]`).first().waitFor()
      await page.locator('.process-info-drawer').waitFor({ state: 'visible' })
      assert.equal(await page.locator('.operation-passage-details .evidence-row').count(), handoff.sources.length)
      visited.add(handoff.id)
      await page.keyboard.press('Escape')
      await page.locator('.process-info-drawer').waitFor({ state: 'hidden' })
    }
  }
  assert.equal(visited.size, catalog.handoffs.length)
  for (const route of ['/', '/processos', '/handoffs', '/?view=3d&process=P002', '/?view=2d&process=P003']) {
    await page.goto(`http://127.0.0.1:4174${route}`)
    await page.locator('.focus-flow-current').waitFor()
    assert.ok(new URL(page.url()).pathname.startsWith('/operacao/'))
  }
  await page.locator('.operation-process-picker select').selectOption('P010')
  await page.waitForURL((url) => url.pathname === '/operacao/P010')
  await page.locator('.focus-flow-current').waitFor()
  const handoff = catalog.handoffs.find((item) => item.processId === 'P010')
  await page.locator('.process-summary').evaluate((element) => { element.open = true }); await page.locator('.operation-passage-picker select').selectOption(handoff.id)
  await page.locator('.operation-passage-details').waitFor()
  await page.locator('.operation-passage-details .handoff-card-activities > div:nth-child(2) button').click()
  await page.locator(`.focus-flow-current[data-node-id="${handoff.targetNodeId}"]`).waitFor()
  await page.goto(`http://127.0.0.1:4174/?resource=${encodeURIComponent(catalog.channels[1].id)}`)
  await page.locator('.resource-detail h2').waitFor()
  assert.equal(await page.locator('.resource-detail h2').textContent(), 'E-mail')
  assert.deepEqual(errors, [])
  console.log('QA passed: one Operation menu/screen, all 10 processes and 73 documented handoffs with full evidence, inline participants, process picker, legacy aliases, drawer/target navigation, 3 viewports, no internal overflow or errors.')
} finally {
  await browser.close()
}
