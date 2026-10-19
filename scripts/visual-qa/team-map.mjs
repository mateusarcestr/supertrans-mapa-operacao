import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const catalog = JSON.parse(await readFile(new URL('../../frontend/public/data/catalog.json', import.meta.url), 'utf8'))
const output = new URL('../../docs/screenshots/team-map/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
try {
  for (const [theme, width, height] of [['dark', 1366, 900], ['light', 1024, 900], ['light', 390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.goto('http://127.0.0.1:4174/?view=3d&process=P001')
    await page.evaluate((theme) => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.getByRole('heading', { name: 'Mapa de equipes e passagens', exact: true }).waitFor()
    assert.equal(await page.locator('canvas').count(), 0)
    assert.equal(await page.locator('.team-map-delivery').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const actors = [...new Set(catalog.handoffs.filter((item) => item.processId === 'P001').flatMap((item) => [item.fromActorId, item.toActorId]))]
    assert.equal(await page.locator('.team-map-teams button').count(), actors.length)
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)), fullPage: true })
    await page.locator('.team-map-network').screenshot({ path: fileURLToPath(new URL(`network-${theme}-${width}.png`, output)) })
    const neighbor = page.locator('.team-map-node').first()
    const expected = Number((await neighbor.locator('.team-map-link-count').textContent()).match(/\d+/)[0])
    await neighbor.click()
    await page.waitForFunction((count) => document.querySelectorAll('.team-map-delivery').length === count, expected)
    assert.equal(await page.locator('.team-map-delivery').count(), expected)
    await page.locator('.team-map-delivery summary').first().click()
    assert.ok((await page.locator('.team-map-delivery details[open]').textContent()).includes('POP/'))
    await page.keyboard.press('Escape')
    await page.locator('.team-map-drawer').waitFor({ state: 'hidden' })
    assert.equal(await page.locator('.team-map-delivery').count(), 0)
    await page.locator('.team-map-toolbar select').selectOption('P010')
    await page.waitForURL((url) => url.searchParams.get('process') === 'P010')
    await page.waitForFunction(() => document.querySelector('.team-map-toolbar select')?.value === 'P010')
    assert.equal(new URL(page.url()).searchParams.get('view'), 'map')
    assert.equal(new URL(page.url()).searchParams.get('process'), 'P010')
    const teamButton = page.locator('.team-map-teams button').first()
    const teamName = await teamButton.textContent()
    const selectedActorId = catalog.actors.find((item) => item.name === teamName)?.id
    await teamButton.click()
    await page.waitForURL((url) => url.searchParams.get('area') === selectedActorId)
    const expectedFocus = catalog.handoffs.filter((item) => item.processId === 'P010' && [item.fromActorId, item.toActorId].includes(selectedActorId)).length
    await page.getByRole('button', { name: 'Ver passagens desta equipe', exact: true }).click()
    await page.waitForFunction((count) => document.querySelectorAll('.team-map-delivery').length === count, expectedFocus)
    assert.equal(await page.locator('.team-map-delivery').count(), expectedFocus)
    await page.getByRole('button', { name: 'Fechar passagens', exact: true }).click()
    await page.locator('.team-map-drawer').waitFor({ state: 'hidden' })
  }
  const preserved = new Set()
  for (const process of catalog.processes) {
    await page.goto(`http://127.0.0.1:4174/?view=map&process=${process.id}`)
    await page.locator('.team-map-network').waitFor()
    assert.equal(await page.locator('.team-map-delivery').count(), 0)
    const teamNames = await page.locator('.team-map-teams button').allTextContents()
    for (const teamName of teamNames) {
      await page.getByRole('navigation', { name: 'Equipe em foco' }).getByRole('button', { name: teamName, exact: true }).click()
      await page.getByRole('button', { name: 'Ver passagens desta equipe', exact: true }).click()
      await page.locator('.team-map-drawer').waitFor({ state: 'visible' })
      for (const id of await page.locator('.team-map-delivery').evaluateAll((items) => items.map((item) => item.getAttribute('data-handoff-id')))) preserved.add(id)
      await page.keyboard.press('Escape')
      await page.locator('.team-map-drawer').waitFor({ state: 'hidden' })
    }
  }
  assert.deepEqual([...preserved].sort(), catalog.handoffs.map((item) => item.id).sort())
  for (const route of ['/', '/handoffs', '/?view=2d']) {
    await page.goto(`http://127.0.0.1:4174${route}`)
    await page.locator('.team-map-network').waitFor()
    assert.equal(await page.locator('.team-map-delivery').count(), 0)
  }
  await page.goto('http://127.0.0.1:4174/?view=matrix')
  await page.locator('.handoff-matrix').waitFor()
  const item = catalog.handoffs[0]
  await page.goto(`http://127.0.0.1:4174/?view=map&process=${item.processId}&activity=${encodeURIComponent(item.sourceNodeId)}`)
  await page.locator('.team-map-network').waitFor()
  assert.ok((await page.locator('.team-map-focus h2').textContent()).length > 0)
  await page.goto(`http://127.0.0.1:4174/?resource=${encodeURIComponent(catalog.channels[1].id)}`)
  await page.locator('.resource-detail h2').waitFor()
  assert.equal(await page.locator('.resource-detail h2').textContent(), 'E-mail')
  assert.deepEqual(errors, [])
  console.log('QA passed: compact map in all 10 processes and primary routes; all 73 handoffs accessible, details on demand, Escape/close, matrix, 3 viewports, activity/resource deep links, no overflow or errors.')
} finally {
  await browser.close()
}
