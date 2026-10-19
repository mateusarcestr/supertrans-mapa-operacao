import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const catalog = JSON.parse(await readFile(new URL('../../frontend/public/data/catalog.json', import.meta.url), 'utf8'))
const output = new URL('../../docs/screenshots/channels/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const [theme, width, height] of [['dark', 1366, 768], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:4174/sistemas?kind=channels')
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.getByRole('tab', { name: 'Canais · 3' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), theme === 'dark')
    const rows = page.locator('.resource-list .resource-row')
    assert.equal(await rows.count(), 3)
    assert.deepEqual(await rows.locator('strong').allTextContents(), ['E-mail', 'Grupo de WhatsApp', 'WhatsApp'])
    assert.equal(await rows.locator('.resource-icon svg').count(), 3)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
    await page.screenshot({ path: new URL(`${theme}-${width}.png`, output).pathname.replace(/^\/(?=[A-Za-z]:)/, ''), fullPage: true })
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  for (const [original, expected] of [['Email', 'E-mail'], ['Grupo de Whatsapp', 'Grupo de WhatsApp']]) {
    const item = catalog.channels.find((entry) => entry.name === original)
    await page.goto(`http://127.0.0.1:4174/sistemas?kind=channels&resource=${encodeURIComponent(item.id)}`)
    await page.locator('.resource-detail h2').waitFor()
    assert.equal(await page.locator('.resource-detail h2').textContent(), expected)
    await page.locator('.resource-detail .skeleton-list').waitFor({ state: 'detached' })
    assert.ok(await page.locator('.linked-activity-list a').count() > 0)
    assert.ok((await page.locator('.resource-detail').textContent()).includes(original))
  }
  assert.deepEqual(errors, [])
  console.log('QA passed: 3 channels, SVG icons, dark desktop/light mobile, no horizontal overflow, legacy IDs, aliases, activities, no page errors.')
} finally {
  await browser.close()
}
