import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import front from '../../assets/blanks/front.webp'
import back from '../../assets/blanks/back.webp'

function Artwork({ side, spots, selected, locked, onSelect, ready, onReady }) {
  return <div className="putty-artwork" data-ready={ready}>
    <img src={side === 'back' ? back : front} alt={`Black hoodie, ${side} view`} width="800" height="1200" onLoad={(event) => {
      const image = event.currentTarget
      if (image.decode) image.decode().catch(() => {}).then(() => onReady(side))
      else onReady(side)
    }} />
    {ready && side === 'back' && <>
      <div className="putty-axis putty-axis--x" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(column => <span key={column}>{column}</span>)}</div>
      <div className="putty-axis putty-axis--y" aria-hidden="true">{'ABCDEFGH'.split('').map(row => <span key={row}>{row}</span>)}</div>
    </>}
    {ready && <div className={`putty-grid putty-grid--${side}`}>
      {spots.filter(spot => side === 'front' ? spot.id === 'front' : spot.id !== 'front').map(spot => {
        return <button key={spot.id} type="button" className="putty-square" aria-pressed={spot.id in selected}
            disabled={locked || (!(spot.id in selected) && (spot.unknown || spot.held))}
            aria-label={`${spot.id === 'front' ? 'Front left chest' : spot.id}: ${spot.unknown ? 'availability not checked' : spot.name ? `${spot.name}, current bid ${formatPrice(spot.total)}` : 'Unclaimed'}${spot.minimum ? `, minimum ${formatPrice(spot.minimum)} USD` : ''}${spot.held ? ', payment in progress' : ''}`}
            onClick={() => onSelect(spot)}>{spot.id === 'front' ? 'left chest' : spot.id}</button>
      })}
    </div>}
  </div>
}

export default function HoodieViewer({ spots, selected, locked, onSelect }) {
  const [side, setSide] = useState('back')
  const [zoom, setZoom] = useState(0)
  const [loadedSide, setLoadedSide] = useState(null)
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
      <div ref={viewport} className="putty-canvas-scroll" tabIndex={0} role="region" aria-label="Hoodie placements; scroll to explore the image" aria-busy={loadedSide !== side}>
        <div ref={canvas} className="putty-canvas" style={{ width: `${(1 + zoom) * 100}%` }}>
          <Artwork side={side} spots={spots} selected={selected} locked={locked} onSelect={onSelect}
            ready={loadedSide === side} onReady={setLoadedSide} />
        </div>
      </div>
    </div>
  </div>
}
