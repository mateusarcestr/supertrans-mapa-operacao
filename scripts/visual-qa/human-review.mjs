import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const catalog = JSON.parse(await readFile(new URL('../../frontend/public/data/catalog.json', import.meta.url), 'utf8'))
const output = new URL('../../docs/screenshots/human-review/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const [theme, width, height] of [['dark', 1366, 900], ['light', 1024, 768], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:4174/documentacao')
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.getByRole('tab', { name: 'Respostas recebidas · 270' }).click()
    const review = page.locator('.human-review-browser')
    await review.waitFor()
    assert.ok((await review.textContent()).includes('270 de 270'))
    let total = 0
    for (const process of catalog.processes) {
      await review.getByRole('combobox').selectOption(process.id)
      const expected = catalog.humanReview.decisions.filter((item) => item.processId === process.id).length
      assert.equal(await review.locator('details').count(), expected)
      total += expected
    }
    assert.equal(total, 270)
    await review.getByRole('combobox').selectOption('P004')
    await review.getByRole('checkbox').check()
    assert.equal(await review.locator('details').count(), 3)
    const missing = review.locator('details').filter({ hasText: 'Item POP indicado não encontrado' }).first()
    await missing.locator('summary').click()
    await missing.locator('.human-review-decision').waitFor({ state: 'visible' })
    assert.ok((await missing.textContent()).includes('Não informado'))
    await page.screenshot({ path: fileURLToPath(new URL(`documentation-${theme}-${width}.png`, output)), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const sample = catalog.humanReview.decisions.find((item) => item.category === 'description')
    const nodeId = sample.entityIds.find((id) => id.includes(':node:'))
    await page.goto(`http://127.0.0.1:4174/operacao/${sample.processId}?activity=${encodeURIComponent(nodeId)}`)
    await page.getByRole('button', { name: 'Ver evidências', exact: true }).click()
    const panel = page.locator('.process-info-drawer')
    await panel.waitFor({ state: 'visible' })
    assert.ok((await panel.textContent()).includes('Revisão operacional recebida'))
    assert.ok((await panel.textContent()).includes(sample.source.sheet + '!' + sample.source.cell))
    assert.ok((await panel.textContent()).includes('CONFLITO ENTRE FONTES'))
    await panel.locator('.human-review-decision').first().scrollIntoViewIfNeeded()
    await page.screenshot({ path: fileURLToPath(new URL(`activity-${theme}-${width}.png`, output)) })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.keyboard.press('Escape')
    await panel.waitFor({ state: 'hidden' })
  }
  assert.deepEqual(errors, [])
  console.log('Human review QA OK: 270 answers, filters, missing POP item, activity evidence, unchanged conflict, 3 viewports/themes.')
} finally {
  await browser.close()
}
