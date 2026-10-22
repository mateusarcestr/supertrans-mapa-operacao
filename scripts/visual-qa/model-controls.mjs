import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const output = new URL('../../docs/screenshots/model-controls/', import.meta.url)
await mkdir(output, { recursive: true })
const models = [
  { id: 'nvidia/nemotron-3.5-super-vl-120b-a12b', label: 'Nemotron 3.5 Super', efforts: ['none', 'standard'] },
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', label: 'Nemotron 3.5 Lightning', efforts: ['none', 'standard'] },
]
const browser = await chromium.launch({ headless: true })
try {
  for (const [theme, width] of [['dark', 1366], ['light', 1366], ['dark', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let state = { model: models[0].id, effort: 'none', models, keyConfigured: true, locked: false, mode: 'nvidia-api', externalContext: true }
    let question
    let respond = true
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/chat/settings') {
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON()
          assert.equal(body.apiKey, undefined)
          state = { ...state, ...body }
        }
        return route.fulfill({ json: state })
      }
      if (path === '/api/chat') {
        question = route.request().postDataJSON()
        if (!respond) { await new Promise(resolve => setTimeout(resolve, 2500)) }
        return route.fulfill({ json: { mode: 'nvidia-api', answer: 'Resposta simulada com a seleção escolhida.', sources: [] } }).catch(() => {})
      }
      return route.abort()
    })
    await page.goto('http://127.0.0.1:4174/')
    await page.evaluate(theme => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    const model = page.getByRole('combobox', { name: 'Modelo do chat', exact: true })
    const effort = page.getByRole('combobox', { name: 'Esforço do modelo', exact: true })
    await model.selectOption(models[1].id)
    await page.waitForFunction(() => document.querySelector('[aria-label="Modelo do chat"]').value.includes('lightning'))
    await effort.selectOption('standard')
    await page.waitForFunction(() => document.querySelector('[aria-label="Esforço do modelo"]').value === 'standard')
    await page.reload()
    await page.waitForFunction(() => document.querySelector('[aria-label="Modelo do chat"]')?.value.includes('lightning') && document.querySelector('[aria-label="Esforço do modelo"]')?.value === 'standard')
    assert.equal(await model.inputValue(), models[1].id)
    assert.equal(await effort.inputValue(), 'standard')
    assert.deepEqual(await page.locator('.assistant-model-controls label > span').allTextContents(), ['Modelo', 'Esforço', 'Processo'])
    const selects = await page.locator('.assistant-model-controls select').evaluateAll(elements => elements.map(el => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top })))
    assert.equal(new Set(selects.map(el => el.height)).size, 1)
    assert.equal(new Set(selects.map(el => el.top)).size, 1)
    await page.getByRole('combobox', { name: 'Consultar processo', exact: true }).selectOption('P002')
    const input = page.getByRole('textbox', { name: 'Sua pergunta sobre o processo' })
    await input.fill('Pergunta de teste')
    await page.getByRole('button', { name: 'Enviar pergunta' }).click()
    await page.getByText('Resposta simulada com a seleção escolhida.', { exact: true }).waitFor()
    assert.equal(question.model, models[1].id)
    assert.equal(question.effort, 'standard')
    assert.equal(question.processId, 'P002')
    respond = false
    await input.fill('Espera de teste')
    await page.getByRole('button', { name: 'Enviar pergunta' }).click()
    await page.getByText('Consultando Nemotron 3.5 Lightning…', { exact: false }).waitFor()
    assert.equal(await model.isDisabled(), true)
    await page.waitForFunction(() => parseInt(document.querySelector('.assistant-loading span')?.textContent || '0', 10) >= 1)
    await page.screenshot({ path: fileURLToPath(new URL(`waiting-${theme}-${width}.png`, output)) })
    await page.getByRole('button', { name: 'Interromper espera' }).click()
    await page.getByText('Espera interrompida nesta tela.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Enviar pergunta' }).isVisible(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight + 1), false)
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)) })
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('Model controls OK: save/reload, per-question model+effort, pending/cancel, no key submission, desktop/mobile/themes. All API mocked.')
} finally { await browser.close() }
