import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type SetStateAction } from 'react'

import { resetPlayback, type PlaybackGraph, type PlaybackState } from './playback'

export interface PlaybackSession {
  processId: string
  diagramId: string
  state: PlaybackState
}

interface PlaybackContextValue {
  session: PlaybackSession | null
  ensureSession: (processId: string, diagramId: string, graph: PlaybackGraph) => void
  updateSession: (processId: string, diagramId: string, updater: SetStateAction<PlaybackState>) => void
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlaybackSession | null>(null)

  const ensureSession = useCallback((processId: string, diagramId: string, graph: PlaybackGraph) => {
    setSession((current) => current?.processId === processId && current.diagramId === diagramId
      ? current
      : { processId, diagramId, state: resetPlayback(graph) })
  }, [])

  const updateSession = useCallback((processId: string, diagramId: string, updater: SetStateAction<PlaybackState>) => {
    setSession((current) => {
      if (!current || current.processId !== processId || current.diagramId !== diagramId) return current
      const state = typeof updater === 'function'
        ? (updater as (previous: PlaybackState) => PlaybackState)(current.state)
        : updater
      return { ...current, state }
    })
  }, [])

  const value = useMemo(() => ({ session, ensureSession, updateSession }), [ensureSession, session, updateSession])
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlaybackSession(): PlaybackContextValue {
  const value = useContext(PlaybackContext)
  if (!value) throw new Error('Playback context missing')
  return value
}
