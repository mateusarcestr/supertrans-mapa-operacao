import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const output = new URL('../../docs/screenshots/dark-theme/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const [theme, width, height] of [['dark', 1366, 900], ['dark', 1024, 768], ['dark', 390, 844], ['light', 1366, 900], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:4174/operacao/P001')
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.locator('.focus-flow-current').waitFor()
    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      return { sidebar: root.getPropertyValue('--sidebar').trim(), background: root.getPropertyValue('--background').trim(), card: root.getPropertyValue('--card').trim() }
    })
    assert.equal(tokens.sidebar, '#101112')
    if (theme === 'dark') {
      assert.equal(tokens.background, '#24272c')
      assert.equal(tokens.card, '#30343b')
    }
    assert.equal(await page.locator('.operation-toolbar .with-field-icon > svg').count(), 3)
    for (const select of await page.locator('.operation-toolbar .with-field-icon > select').all()) {
      assert.ok(await select.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft)) >= 38)
    }
    assert.ok(await page.locator('.focus-flow-current svg').count() >= 6)
    assert.ok(await page.locator('.operation-view-toggle svg').count() === 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.locator('.operation-toolbar').scrollIntoViewIfNeeded()
    await page.screenshot({ path: fileURLToPath(new URL(`operation-${theme}-${width}.png`, output)), fullPage: true })
    if (width === 1366) {
      const sidebar = page.locator('aside').first()
      assert.equal(await sidebar.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(16, 17, 18)')
    }
    await page.getByRole('button', { name: 'Ver evidências', exact: true }).click()
    await page.locator('.process-info-drawer').waitFor({ state: 'visible' })
    assert.ok(await page.locator('.process-info-drawer h4 svg').count() >= 4)
    await page.screenshot({ path: fileURLToPath(new URL(`drawer-${theme}-${width}.png`, output)) })
    await page.keyboard.press('Escape')
    await page.goto('http://127.0.0.1:4174/documentacao')
    await page.getByRole('tab', { name: 'Fontes', exact: true }).waitFor()
    assert.equal(await page.locator('.evidence-tabs button svg').count(), 6)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    await page.screenshot({ path: fileURLToPath(new URL(`evidence-${theme}-${width}.png`, output)), fullPage: true })
  }
  await page.getByRole('button', { name: 'Mudar para o tema escuro' }).click()
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  assert.deepEqual(errors, [])
  console.log('Theme QA OK: black sidebar, lighter graphite surfaces, SVG icons, dark/light, 3 widths, drawer, evidence tabs, theme persistence, no overflow/errors.')
} finally {
  await browser.close()
}
