import { Lightbulb } from 'lucide-react'

// Blocks arrive already validated by the server: atomic values are literal copies of cited evidence.
export type AnswerBlock =
  | { type: 'highlight'; title?: string | null; text: string; sources: number[] }
  | { type: 'list'; title?: string | null; items: string[]; sources: number[] }
  | { type: 'chips'; title?: string | null; items: string[]; sources: number[] }
  | { type: 'table'; title?: string | null; columns: string[]; rows: string[][]; sources: number[] }
  | { type: 'cards'; title?: string | null; items: { title: string; text?: string | null; label?: string | null }[]; sources: number[] }

function Sources({ refs }: { refs: number[] }) {
  return <span className="answer-block-sources">Fonte {refs.join(', ')}</span>
}

function Block({ block }: { block: AnswerBlock }) {
  switch (block.type) {
    case 'highlight':
      return (
        <p className="answer-highlight">
          <Lightbulb size={16} aria-hidden="true" />
          {block.text}
        </p>
      )
    case 'list':
      return (
        <ul className="answer-list">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'chips':
      return (
        <ul className="answer-chips">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <div className="answer-table">
          <table>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'cards':
      return (
        <ul className="answer-cards">
          {block.items.map((card) => (
            <li key={card.title}>
              <strong>{card.title}</strong>
              {card.text && <p>{card.text}</p>}
              {card.label && <span>{card.label}</span>}
            </li>
          ))}
        </ul>
      )
  }
}

export function AnswerBlocks({ blocks }: { blocks?: AnswerBlock[] }) {
  if (!blocks?.length) return null
  return (
    <div className="answer-blocks">
      {blocks.map((block, index) => (
        <section className={`answer-block is-${block.type}`} key={index} aria-label={block.title || undefined}>
          {(block.title || block.sources.length > 0) && (
            <header>
              {block.title && <h3>{block.title}</h3>}
              <Sources refs={block.sources} />
            </header>
          )}
          <Block block={block} />
        </section>
      ))}
    </div>
  )
}
