import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
async function request(url, options) {
  try { return await fetch(url, { ...options, signal: AbortSignal.timeout(1000) }) } catch { return null }
}
for (const port of [5173, 8765]) {
  assert.equal(await request(`http://localhost:${port}/api/chat/status`), null, `Port ${port} must be free; do not stop someone else's server.`)
}
// IPC emits the same SIGINT event used by Ctrl+C, including on Windows.
const child = spawn(process.execPath, ['--input-type=module', '-e', "process.on('message', () => { process.disconnect(); process.emit('SIGINT') }); await import('./frontend/scripts/dev.mjs')"],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true })
let output = ''
child.stdout.on('data', data => { output += data })
child.stderr.on('data', data => { output += data })
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Dev exited before ready: ${output}`)
    if (output.includes('[dev] Frontend e assistente prontos.')) { ready = true; break }
    await delay(200)
  }
  assert.ok(ready, 'Combined startup must finish')
  for (const path of ['/api/chat/status', '/api/chat/settings']) {
    const response = await request(`http://localhost:5173${path}`)
    assert.equal(response?.status, 200)
  }
  const response = await request('http://localhost:5173/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ question: 'Quem executa as etapas deste processo?', processId: 'P001' }) })
  assert.equal(response?.status, 200)
  const reply = await response.json()
  assert.ok(reply.responsibilities.length > 3)
  assert.ok(reply.responsibilities.some(role => role.executor === 'Cliente'))
  child.send('stop')
  for (let attempt = 0; attempt < 50 && child.exitCode === null; attempt++) await delay(100)
  assert.equal(child.exitCode, 0, 'Ctrl+C handler must exit cleanly')
  for (const port of [5173, 8765]) assert.equal(await request(`http://localhost:${port}/api/chat/status`), null, `Port ${port} must close`)
  console.log('Dev lifecycle OK: starts both services, proxy/settings/chat work, SIGINT closes both owned services.')
} finally {
  if (child.exitCode === null && child.connected) child.send('stop')
  if (child.connected) child.disconnect()
}
