import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import front from '../../assets/blanks/front.webp'
import back from '../../assets/blanks/back.webp'

function Artwork({ side, spots, selected, locked, checking, onSelect, decorative = false }) {
  return <div className="putty-artwork">
    <img src={side === 'back' ? back : front} alt={decorative ? '' : `Black hoodie, ${side} view`} width="800" height="1200" />
    <div className={`putty-grid putty-grid--${side}`}>
      {spots.filter(spot => side === 'front' ? spot.id === 'front' : spot.id !== 'front').map(spot => {
        const content = <><span>{spot.id in selected ? '✓ ' : ''}{spot.id === 'front' ? 'left chest' : spot.id}</span><small>{checking === spot.id ? 'checking…' : spot.held ? 'held' : spot.name || '+'}</small></>
        return decorative ? <span key={spot.id} className="putty-square" data-selected={spot.id in selected}>{content}</span>
          : <button key={spot.id} type="button" className="putty-square" aria-pressed={spot.id in selected}
            disabled={locked || Boolean(checking)}
            aria-label={`${spot.id === 'front' ? 'Front left chest' : spot.id}: ${spot.unknown ? 'availability not checked' : spot.name ? `${spot.name}, current bid ${formatPrice(spot.total)}` : 'Unclaimed'}${spot.minimum ? `, minimum ${formatPrice(spot.minimum)} USD` : ''}${spot.held ? ', payment in progress' : ''}`}
            onClick={() => onSelect(spot)}>{content}</button>
      })}
    </div>
  </div>
}

export default function HoodieViewer({ spots, selected, locked, checking, onSelect }) {
  const [side, setSide] = useState('back')
  const [zoom, setZoom] = useState(1)
  const [magnify, setMagnify] = useState(true)
  const [point, setPoint] = useState(null)
  const canvas = useRef(null)
  const viewport = useRef(null)

  useEffect(() => {
    viewport.current.scrollLeft = (canvas.current.clientWidth - viewport.current.clientWidth) / 2
  }, [zoom])

  useEffect(() => {
    if (!magnify) return
    const dismiss = event => { if (event.key === 'Escape') { setMagnify(false); setPoint(null) } }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [magnify])

  function inspect(event) {
    if (!magnify || event.pointerType === 'touch') return
    const rect = canvas.current.getBoundingClientRect()
    setPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width })
  }

  return <div className="putty-gallery">
    <div className="putty-thumbnails" role="group" aria-label="Hoodie view">
      {[['front', front], ['back', back]].map(([view, image]) => <button key={view} type="button" aria-pressed={side === view}
        onClick={() => { setSide(view); setPoint(null) }}>
        <img src={image} alt="" width="800" height="1200" /><span>{view}</span>
      </button>)}
    </div>
    <div className="putty-viewer">
      <div className="putty-canvas-tools" role="group" aria-label="Image viewing tools">
        <button type="button" aria-label="Shrink hoodie image" disabled={zoom === 1} onClick={() => { setZoom(value => Math.max(1, value - .25)); setPoint(null) }}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Enlarge hoodie image" disabled={zoom === 2} onClick={() => { setZoom(value => Math.min(2, value + .25)); setPoint(null) }}>+</button>
        <button type="button" aria-label="Magnifying glass" aria-pressed={magnify} onClick={() => { setMagnify(value => !value); setPoint(null) }}><span className="putty-magnifier-icon" aria-hidden="true" /></button>
      </div>
      <div ref={viewport} className="putty-canvas-scroll" tabIndex={0} role="region" aria-label="Hoodie placements; scroll to explore the image" onScroll={() => setPoint(null)}>
        <div ref={canvas} className="putty-canvas" style={{ width: `${zoom * 100}%`, minWidth: 680 * zoom }} onPointerMove={inspect} onPointerLeave={() => setPoint(null)} onPointerDown={() => setPoint(null)}>
          <Artwork side={side} spots={spots} selected={selected} locked={locked} checking={checking} onSelect={onSelect} />
          {magnify && point && <div className="putty-lens" aria-hidden="true" style={{ left: Math.min(Math.max(point.x + 24, 0), point.width - 160), top: Math.max(0, point.y - 180) }}>
            <div className="putty-lens-image" style={{ width: point.width * 2, left: 80 - point.x * 2, top: 80 - point.y * 2 }}>
              <Artwork side={side} spots={spots} selected={selected} decorative />
            </div>
          </div>}
        </div>
      </div>
    </div>
  </div>
}
