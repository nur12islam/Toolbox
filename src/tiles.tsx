import type { ReactNode } from 'react'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'

export type TileSize = 'big' | 'wide' | 'small'

const sizes: Record<string, TileSize> = {
  photo: 'big',
  color: 'wide',
  gradient: 'wide',
  signature: 'wide',
  'remove-bg': 'wide',
}

/** Bento layout: the hero tool is big, a few tools are wide, the rest are square. */
export const tileSize = (id: string): TileSize => sizes[id] ?? 'small'

// Deterministic pseudo-random QR modules so the illustration never changes between renders.
const qrCells: [number, number][] = []
let seed = 7
for (let y = 0; y < 21; y += 1) {
  for (let x = 0; x < 21; x += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)
    if (!inFinder && (seed >> 16) % 100 < 46) qrCells.push([x, y])
  }
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </>
  )
}

const Person = () => <span className="art-person" />

/** Small decorative illustration for each tool tile. Always aria-hidden by the caller. */
export function TileArt({ id }: { id: string }): ReactNode {
  switch (id) {
    case 'photo':
      return (
        <div className="art-photo">
          <div className="art-photo-frame">
            <div className="art-photo-img">
              <Person />
            </div>
            <i className="h tl" />
            <i className="h tr" />
            <i className="h bl" />
            <i className="h br" />
          </div>
          <div className="art-chips">
            <span>200 × 230 px</span>
            <span>under 50 KB</span>
            <span>JPEG</span>
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="art-resize">
          <span className="a" />
          <span className="b" />
        </div>
      )
    case 'pdf':
      return (
        <div className="art-pages">
          <span />
          <span />
          <span />
        </div>
      )
    case 'qr':
      return (
        <div className="art-qr">
          <svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
            <Finder x={0} y={0} />
            <Finder x={14} y={0} />
            <Finder x={0} y={14} />
            {qrCells.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
            ))}
          </svg>
        </div>
      )
    case 'favicon':
      return (
        <div className="art-fav">
          <span>T</span>
          <span>T</span>
          <span>T</span>
        </div>
      )
    case 'color':
      return (
        <div className="art-swatches">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )
    case 'gradient':
      return (
        <div className="art-grad">
          <i style={{ left: '14%' }} />
          <i style={{ left: '86%' }} />
        </div>
      )
    case 'merge-pdf':
      return (
        <div className="art-merge">
          <span className="p" />
          <span className="p" />
          <ArrowRight size={18} />
          <span className="p big" />
        </div>
      )
    case 'compress-pdf':
      return (
        <div className="art-bars">
          <div className="row">
            <span className="bar" />
            <small>12 MB</small>
          </div>
          <div className="row">
            <span className="bar small" />
            <small>2.4 MB</small>
          </div>
        </div>
      )
    case 'remove-bg':
      return (
        <div className="art-cut">
          <Person />
        </div>
      )
    case 'signature':
      return (
        <svg className="art-sign" viewBox="0 0 220 60" width="230" height="62">
          <path
            d="M6 40 C20 6 34 6 30 36 S52 52 62 26 S84 4 88 30 C92 52 112 50 120 28 C126 12 140 14 138 34 S160 50 176 22 L214 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="6" y1="54" x2="214" y2="54" stroke="currentColor" strokeOpacity=".25" />
        </svg>
      )
    case 'word-count':
      return (
        <div className="art-text">
          <div className="lines">
            <span style={{ width: '100%' }} />
            <span style={{ width: '82%' }} />
            <span style={{ width: '94%' }} />
            <span style={{ width: '48%' }} />
          </div>
          <div className="count">
            <strong>1,284</strong>
            <small>words</small>
          </div>
        </div>
      )
    case 'unit':
      return (
        <div className="art-unit">
          <span>1 mi</span>
          <ArrowLeftRight size={16} />
          <span>1.61 km</span>
        </div>
      )
    default:
      return null
  }
}
