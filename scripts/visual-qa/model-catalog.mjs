import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const catalog = JSON.parse(await readFile(new URL('../../docs/review/nvidia-catalog-2026-10-22.json', import.meta.url), 'utf8'))
const output = new URL('../../docs/screenshots/model-catalog/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  for (const [theme, width] of [['dark', 1366], ['light', 1366], ['dark', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let refreshes = 0
    let fail = false
    let selected = catalog.models.find(model => model.id === 'nvidia/nemotron-3.5-super-vl-120b-a12b')
    let effort = selected.efforts[0]
    let question
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/chat/models') {
        if (url.searchParams.has('refresh')) refreshes++
        return route.fulfill({ json: fail ? { models: catalog.models, error: 'Catálogo temporariamente indisponível; exibindo última consulta.', stale: true } : catalog })
      }
      if (url.pathname === '/api/chat/settings') {
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON()
          assert.equal(body.apiKey, undefined)
          selected = catalog.models.find(model => model.id === body.model)
          effort = body.effort
        }
        return route.fulfill({ json: { model: selected.id, effort, models: [selected], keyConfigured: true, locked: false, mode: 'nvidia-api', externalContext: true } })
      }
      if (url.pathname === '/api/chat') {
        question = route.request().postDataJSON()
        return route.fulfill({ json: { mode: 'nvidia-api', answer: 'Resposta simulada.', sources: [] } })
      }
      return route.abort()
    })
    await page.goto('http://127.0.0.1:4174/')
    await page.evaluate(theme => localStorage.setItem('supertrans-theme', theme), theme)
    await page.reload()
    const trigger = page.getByRole('combobox', { name: 'Modelo do chat', exact: true })
    await trigger.click()
    const picker = page.getByRole('dialog', { name: 'Escolher modelo', exact: true })
    await picker.getByRole('option').first().waitFor()
    assert.equal(await picker.getByRole('option').count(), catalog.models.length)
    assert.ok(await picker.getByRole('option', { name: /GPT OSS 20B/ }).count())
    assert.ok(await picker.getByRole('option', { name: /GLM 5.3/ }).count())
    assert.equal(await picker.locator('.assistant-model-row p').count(), catalog.models.length)
    await picker.getByRole('textbox', { name: 'Buscar modelos NVIDIA' }).fill('embed')
    assert.ok(await picker.getByRole('option').count() > 0)
    assert.equal(await picker.getByRole('option').first().isDisabled(), true)
    await picker.getByRole('textbox', { name: 'Buscar modelos NVIDIA' }).fill('deepseek v4.1')
    assert.equal(await picker.getByRole('option').count(), 1)
    await page.screenshot({ path: fileURLToPath(new URL(`${theme}-${width}.png`, output)) })
    await picker.getByRole('option').click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Modelo do chat"]').title === 'deepseek-ai/deepseek-v4.1-flash')
    assert.equal(await page.getByRole('combobox', { name: 'Esforço do modelo' }).isDisabled(), true)
    await page.getByRole('textbox', { name: 'Sua pergunta sobre o processo' }).fill('Pergunta de teste')
    await page.getByRole('button', { name: 'Enviar pergunta' }).click()
    await page.getByText('Resposta simulada.', { exact: true }).waitFor()
    assert.equal(question.model, 'deepseek-ai/deepseek-v4.1-flash')
    await trigger.click()
    await picker.getByRole('textbox', { name: 'Buscar modelos NVIDIA' }).fill('gpt oss')
    await picker.getByRole('option', { name: /GPT OSS 20B/ }).click()
    await page.waitForFunction(() => document.querySelector('[aria-label="Esforço do modelo"]').querySelectorAll('option').length === 3)
    fail = true
    await trigger.click()
    await picker.getByRole('button', { name: 'Atualizar catálogo NVIDIA' }).click()
    await picker.getByRole('alert').waitFor()
    assert.equal(refreshes, 1)
    assert.equal(await picker.getByRole('option').count(), catalog.models.length)
    assert.equal(await picker.evaluate(el => el.scrollWidth > el.clientWidth), false)
    await page.keyboard.press('Escape')
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('Catalog QA OK: all official snapshot models, sentence summaries, search/provider/type, specialized disabled, DeepSeek/GPT selection, effort mapping, refresh/error/cache, themes/mobile. No inference or credentials used.')
} finally { await browser.close() }
