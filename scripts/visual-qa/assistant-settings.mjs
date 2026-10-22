import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const output = new URL('../../docs/screenshots/assistant-settings/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
try {
  for (const [theme, width] of [['light', 1366], ['dark', 1366], ['light', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    page.on('pageerror', error => errors.push(error.message))
    let state = { model: 'nvidia/nemotron-3.5-super-vl-120b-a12b', keyConfigured: false, locked: false, mode: 'local-search', externalContext: false }
    let saves = 0
    await page.route('**/api/chat/settings', async route => {
      if (route.request().method() === 'POST') {
        const data = route.request().postDataJSON()
        if (saves === 0) assert.equal(data.apiKey, 'qa-placeholder')
        state = { ...state, model: data.model, keyConfigured: !data.removeKey, mode: data.removeKey ? 'local-search' : 'nvidia-api', externalContext: !data.removeKey }
        saves++
      }
      await route.fulfill({ json: state })
    })
    await page.goto('http://127.0.0.1:8765/')
    await page.evaluate(theme => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    await page.getByRole('button', { name: 'Configurações da IA', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Chave de API NVIDIA').waitFor()
    assert.equal(await dialog.getByLabel('Chave de API NVIDIA').getAttribute('type'), 'password')
    await dialog.getByLabel('Modelo', { exact: true }).selectOption('custom')
    await dialog.getByLabel('Identificador do modelo').fill('example/test-model')
    await dialog.getByLabel('Chave de API NVIDIA').fill('qa-placeholder')
    await dialog.getByRole('button', { name: 'Salvar configuração' }).click()
    await dialog.getByRole('status').waitFor()
    assert.equal(saves, 1)
    assert.equal(await dialog.getByLabel('Chave de API NVIDIA').inputValue(), '')
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('qa-placeholder')), false)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false)
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)), fullPage: true })
    await dialog.getByRole('checkbox', { name: 'Remover chave e usar busca local' }).check()
    await dialog.getByRole('button', { name: 'Salvar configuração' }).click()
    await dialog.getByText('Configuração salva. Assistente em busca local.', { exact: true }).waitFor()
    assert.equal(saves, 2)
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Configurações da IA', exact: true }).click()
    await dialog.getByLabel('Chave de API NVIDIA').waitFor()
    assert.equal(await dialog.getByLabel('Chave de API NVIDIA').inputValue(), '')
    await page.close()
  }
  assert.deepEqual(errors, [])
  console.log('Settings QA passed: save/custom model/remove/Escape, no key persistence in browser, desktop/mobile, light/dark. Mock provider only.')
} finally { await browser.close() }
