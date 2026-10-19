import { useEffect, useRef, useState } from 'react'

import { sourceSummary } from '../data/model'
import type { SourceReference } from '../data/types'

export function EvidenceList({ sources, match, showAll = false }: { sources: SourceReference[]; match?: string; showAll?: boolean }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ?? [])]
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])
  if (sources.length === 0) return <p className="muted">Não documentado</p>
  return (
    <>
      <div className="evidence-list">
        {(showAll ? sources : sources.slice(0, 4)).map((source, index) => <div key={`${source.kind}-${source.file}-${index}`} className="evidence-row">{sourceSummary(source)}</div>)}
      </div>
      <div className="evidence-actions">
        {match && <span className="match-label">Match: {match}</span>}
        {!showAll && sources.length > 4 && <button ref={triggerRef} className="text-button" onClick={() => setOpen(true)} aria-haspopup="dialog">Ver detalhes ({sources.length})</button>}
      </div>
      {open && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="evidence-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><span className="eyebrow">Rastreabilidade</span><h3 id="evidence-title">Evidências da fonte</h3></div><button className="icon-button" aria-label="Fechar evidências" onClick={() => setOpen(false)}>×</button></div>
            {sources.map((source, index) => <div key={`${source.kind}-${source.file}-${index}`} className="evidence-row evidence-row-full">{sourceSummary(source)}</div>)}
          </section>
        </div>
      )}
    </>
  )
}
