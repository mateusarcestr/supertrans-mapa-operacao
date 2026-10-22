// Requires the local app with an NVIDIA key already configured. Never saves settings.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../frontend/package.json', import.meta.url))
const { chromium } = require('playwright')
const envPath = new URL('../../.env.local', import.meta.url)
const before = await readFile(envPath)
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  // Explicitly block all document questions; only status/settings/synthetic probe are allowed.
  await page.route('**/api/chat', route => route.abort())
  await page.goto('http://localhost:5173/')
  await page.getByText('NVIDIA NIM · respostas com fontes', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Configurações da IA', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Testar conexão' }).waitFor()
  assert.equal(await dialog.getByLabel('Chave de API NVIDIA').inputValue(), '')
  await dialog.getByRole('button', { name: 'Testar conexão' }).click()
  await page.waitForFunction(() => {
    const dialog = document.querySelector('dialog[open]')
    return Boolean(dialog?.querySelector('[role="alert"]')?.textContent || dialog?.textContent?.includes('Conexão confirmada:'))
  }, undefined, { timeout: 40000 })
  const diagnostic = await dialog.locator('[role="alert"]').allTextContents()
  assert.equal(await dialog.getByLabel('Chave de API NVIDIA').inputValue(), '')
  await page.screenshot({ path: fileURLToPath(new URL('../../docs/screenshots/assistant-settings/connection-confirmed.png', import.meta.url)) })
  assert.ok(before.equals(await readFile(envPath)), 'Existing settings must remain byte-identical')
  console.log(JSON.stringify({ uiCompleted: true, connectionConfirmed: diagnostic.length === 0, diagnostic, settingsUnchanged: true, documentQuestionsBlocked: true }))
} finally { await browser.close() }
