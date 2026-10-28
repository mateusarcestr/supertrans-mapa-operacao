interface PriorTurn {
  question: string
  reply?: { answer?: string; sources: readonly { id: string }[] }
  error?: string
}

const MAX_BODY_BYTES = 12000 // scripts/chat_server.py request limit
const encoder = new TextEncoder()

export function buildChatPayload(
  question: string,
  processId: string | null,
  model: string | undefined,
  effort: string | undefined,
  turns: readonly PriorTurn[],
) {
  const previous = [...turns].reverse().find((turn) => turn.reply)
  let history: { question: string; sources: { id: string }[] } | null = previous?.reply
    ? { question: previous.question, sources: previous.reply.sources.map(({ id }) => ({ id })) }
    : null
  const payload = { question, processId, model, effort, history }
  const bytes = () => encoder.encode(JSON.stringify(payload)).length

  // Preserve the most relevant source IDs while respecting the server's body limit.
  while (history?.sources.length && bytes() > MAX_BODY_BYTES) history.sources.pop()
  if (bytes() > MAX_BODY_BYTES) {
    history = null
    payload.history = history
  }
  return payload
}
