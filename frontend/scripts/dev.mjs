import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const root = fileURLToPath(new URL('../../', import.meta.url))
let backend
let vite
let stopping = false

async function health() {
  try {
    const response = await fetch('http://127.0.0.1:8765/api/chat/status', { signal: AbortSignal.timeout(500) })
    const status = await response.json()
    if (!response.ok || status.service !== 'supertrans-process-assistant') throw new Error('A porta 8765 está ocupada por outro serviço ou uma versão antiga. Encerre esse serviço antes de iniciar.')
    return true
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED' || error.name === 'TimeoutError') return false
    throw error
  }
}

async function stop(code = 0) {
  if (stopping) return
  stopping = true
  await vite?.close()
  // Only stop the Python process started by this command. Never kill a reused server.
  backend?.kill()
  process.exitCode = code
}

process.on('SIGINT', () => void stop())
process.on('SIGTERM', () => void stop())

try {
  if (await health()) {
    console.log('[assistente] Backend existente disponível em http://127.0.0.1:8765')
  } else {
    backend = spawn(process.env.PYTHON || 'python', ['-X', 'utf8', '-m', 'scripts.chat_server', '--port', '8765'], { cwd: root, stdio: 'inherit', windowsHide: true })
    let failure
    backend.on('error', () => { failure = new Error('Python não encontrado. Instale Python 3.12+ ou defina PYTHON com o caminho do executável.'); void stop(1) })
    backend.on('exit', code => { if (!stopping) { failure = new Error(`Backend encerrado (código ${code}).`); console.error(failure.message); void stop(1) } })
    let ready = false
    for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
      if (failure) throw failure
      if (await health()) { ready = true; break }
      await delay(250)
    }
    if (!ready) throw failure || new Error('Backend não respondeu na porta 8765. Confira a saída do Python.')
  }
  if (!stopping) {
    vite = await createServer({ root: frontend, configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)), server: { strictPort: true } })
    if (stopping) await vite.close()
    else {
      await vite.listen()
      if (stopping) await vite.close()
      else {
        vite.printUrls()
        console.log('[dev] Frontend e assistente prontos. Ctrl+C encerra os serviços iniciados aqui.')
      }
    }
  }
} catch (error) {
  console.error(error.message)
  await stop(1)
}
