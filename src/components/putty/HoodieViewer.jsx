import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import { puttyPriceHue, puttyPublicUrl } from '../../lib/putty'
import front from '../../assets/blanks/front.webp'
import back from '../../assets/blanks/back.webp'

function artworkStyle(spot, spots) {
  const image = puttyPublicUrl(spot.image_url)
  if (!image) return undefined
  if (spot.id === 'front') return { backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
  const group = spots.filter(item => item.id !== 'front' && item.image_url === spot.image_url
    && (item.image_group || item.id) === (spot.image_group || spot.id))
  const rows = group.map(item => item.id.charCodeAt(0) - 65)
  const columns = group.map(item => Number(item.id.slice(1)) - 1)
  const top = Math.min(...rows), left = Math.min(...columns)
  const height = Math.max(...rows) - top + 1, width = Math.max(...columns) - left + 1
  const row = spot.id.charCodeAt(0) - 65 - top, column = Number(spot.id.slice(1)) - 1 - left
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: `${width * 100}% ${height * 100}%`,
    backgroundPosition: `${width === 1 ? 50 : column * 100 / (width - 1)}% ${height === 1 ? 50 : row * 100 / (height - 1)}%`,
  }
}

function Artwork({ side, spots, selected, locked, mode, onSelect, ready, onReady }) {
  return <div className="putty-artwork" data-ready={ready}>
    <img src={side === 'back' ? back : front} alt={`Black hoodie, ${side} view`} width="800" height="1200" onLoad={(event) => {
      const image = event.currentTarget
      if (image.decode) image.decode().catch(() => {}).then(() => onReady(side))
      else onReady(side)
    }} />
    {ready && side === 'back' && mode === 'choose' && <>
      <div className="putty-axis putty-axis--x" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(column => <span key={column}>{column}</span>)}</div>
      <div className="putty-axis putty-axis--y" aria-hidden="true">{'ABCDEFGH'.split('').map(row => <span key={row}>{row}</span>)}</div>
    </>}
    {ready && <div className={`putty-grid putty-grid--${side}`}>
      {spots.filter(spot => side === 'front' ? spot.id === 'front' : spot.id !== 'front').map(spot => {
        const label = spot.id === 'front' ? 'Front left chest' : spot.id
        const details = `${label}: ${spot.unknown ? 'availability not checked' : spot.name ? `${spot.name}, current bid ${formatPrice(spot.total)}` : 'Unclaimed'}${spot.minimum ? `, minimum ${formatPrice(spot.minimum)} USD` : ''}${spot.held ? ', payment in progress' : ''}`
        const artwork = spot.image_url && spots.filter(item => item.image_url === spot.image_url
          && (item.image_group || item.id) === (spot.image_group || spot.id))
        const firstArtworkSpot = artwork && artwork[0]?.id === spot.id
        if (mode === 'preview') return <span key={spot.id} className={`putty-square putty-square--preview${spot.name ? ' putty-square--claimed' : ''}`}
            style={artworkStyle(spot, spots)} role={spot.name || firstArtworkSpot ? 'img' : undefined}
            aria-label={firstArtworkSpot ? `${artwork.map(item => item.id).join(', ')}: ${spot.name || 'Claimed artwork'}. ${spot.image_alt}`
              : !spot.image_url && spot.name ? `${label}: ${spot.name}` : undefined}
            aria-hidden={spot.image_url ? !firstArtworkSpot : !spot.name}>
          {spot.name && !spot.image_url && <span>{spot.name}</span>}
        </span>
        return <button key={spot.id} type="button" className={`putty-square putty-square--choose${spot.name ? ' putty-square--claimed' : ''}`} aria-pressed={spot.id in selected}
            style={{ '--putty-price-hue': puttyPriceHue(spot, spots), ...artworkStyle(spot, spots) }}
            disabled={locked || (!(spot.id in selected) && (spot.unknown || spot.held))}
            aria-label={details} onClick={() => onSelect(spot)}>
          <span>{spot.id === 'front' ? 'chest' : spot.id}</span>
          {!spot.unknown && <small>{formatPrice(spot.minimum)}</small>}
          {spot.name && <b aria-hidden="true">claimed</b>}
        </button>
      })}
    </div>}
  </div>
}

export default function HoodieViewer({ spots, selected, locked, mode, onSelect }) {
  const [side, setSide] = useState('back')
  const [zoom, setZoom] = useState(0)
  const [loadedSide, setLoadedSide] = useState('back')
  const canvas = useRef(null)
  const viewport = useRef(null)

  useEffect(() => {
    viewport.current.scrollLeft = (canvas.current.clientWidth - viewport.current.clientWidth) / 2
  }, [zoom])

  return <div className={`putty-gallery putty-gallery--${mode}`}>
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
          <Artwork side={side} spots={spots} selected={selected} locked={locked} mode={mode} onSelect={onSelect}
            ready={loadedSide === side} onReady={setLoadedSide} />
        </div>
      </div>
    </div>
  </div>
}
