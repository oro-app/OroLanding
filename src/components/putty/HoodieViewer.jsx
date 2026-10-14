import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import front from '../../assets/blanks/front.webp'
import back from '../../assets/blanks/back.webp'

function Artwork({ side, spots, selected, locked, checking, onSelect }) {
  return <div className="putty-artwork">
    <img src={side === 'back' ? back : front} alt={`Black hoodie, ${side} view`} width="800" height="1200" />
    <div className={`putty-grid putty-grid--${side}`}>
      {spots.filter(spot => side === 'front' ? spot.id === 'front' : spot.id !== 'front').map(spot => {
        const content = <><span>{spot.id in selected ? '✓ ' : ''}{spot.id === 'front' ? 'left chest' : spot.id}</span><small>{checking === spot.id ? 'checking…' : spot.held ? 'held' : spot.name || '+'}</small></>
        return <button key={spot.id} type="button" className="putty-square" aria-pressed={spot.id in selected}
            disabled={locked || Boolean(checking)}
            aria-label={`${spot.id === 'front' ? 'Front left chest' : spot.id}: ${spot.unknown ? 'availability not checked' : spot.name ? `${spot.name}, current bid ${formatPrice(spot.total)}` : 'Unclaimed'}${spot.minimum ? `, minimum ${formatPrice(spot.minimum)} USD` : ''}${spot.held ? ', payment in progress' : ''}`}
            onClick={() => onSelect(spot)}>{content}</button>
      })}
    </div>
  </div>
}

export default function HoodieViewer({ spots, selected, locked, checking, onSelect }) {
  const [side, setSide] = useState('back')
  const [zoom, setZoom] = useState(0)
  const canvas = useRef(null)
  const viewport = useRef(null)

  useEffect(() => {
    viewport.current.scrollLeft = (canvas.current.clientWidth - viewport.current.clientWidth) / 2
  }, [zoom])

  return <div className="putty-gallery">
    <div className="putty-thumbnails" role="group" aria-label="Hoodie view">
      {[['front', front], ['back', back]].map(([view, image]) => <button key={view} type="button" aria-label={`Show hoodie ${view}`} aria-pressed={side === view}
        onClick={() => setSide(view)}>
        <img src={image} alt="" width="800" height="1200" />
      </button>)}
    </div>
    <div className="putty-viewer">
      <div className="putty-canvas-tools" role="group" aria-label="Image viewing tools">
        <button type="button" aria-label="Shrink hoodie image" disabled={zoom === 0} onClick={() => setZoom(value => Math.max(0, value - .25))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Enlarge hoodie image" disabled={zoom === 2} onClick={() => setZoom(value => Math.min(2, value + .25))}>+</button>
      </div>
      <div ref={viewport} className="putty-canvas-scroll" tabIndex={0} role="region" aria-label="Hoodie placements; scroll to explore the image">
        <div ref={canvas} className="putty-canvas" style={{ width: `${(1 + zoom) * 100}%` }}>
          <Artwork side={side} spots={spots} selected={selected} locked={locked} checking={checking} onSelect={onSelect} />
        </div>
      </div>
    </div>
  </div>
}
