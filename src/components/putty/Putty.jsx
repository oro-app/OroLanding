import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import { hoodieSpots, puttyPublicUrl, puttyRequest } from '../../lib/putty'
import HoodieViewer from './HoodieViewer'
import '../checkout/Checkout.css'
import './Putty.css'

export default function Putty() {
  const [board, setBoard] = useState(null)
  const [boardError, setBoardError] = useState('')
  const [previewHistory, setPreviewHistory] = useState(null)
  const boardRequest = useRef(0)
  const mounted = useRef(true)
  const refresh = useCallback(async (signal) => {
    const request = ++boardRequest.current
    try {
      const data = await puttyRequest('board', undefined, signal)
      if (!signal?.aborted && mounted.current && request === boardRequest.current) { setBoard(data); setBoardError('') }
    } catch {
      if (!signal?.aborted && mounted.current && request === boardRequest.current) setBoardError('The hoodie preview is unavailable. Retrying shortly.')
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    document.title = 'Merch — bidding closed | Oro'
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    const timer = setInterval(() => refresh(controller.signal), 10000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [refresh])

  const spots = hoodieSpots(board)

  return <div className="checkout-page putty-page halo-container">
    <div className="putty-intro">
      <div className="putty-intro-heading">
        <h1>Make your <em>mark.</em></h1>
        <p className="putty-countdown">
          <span>Bidding closed</span>
          <small><time dateTime="2026-10-14T13:50:00-04:00">Oct 14, 2026 at 1:50 PM ET</time></small>
        </p>
      </div>
      <p>Submissions and bidding are now closed. Thanks to everyone who made their mark.</p>
    </div>
    <div className="putty-layout">
      <section aria-label="Hoodie placement board" className="putty-preview">
        <HoodieViewer mode="preview" spots={spots} leaderboard={board?.leaderboard} selected={{}} locked loading={!board}
          onHistoryChange={setPreviewHistory} />
        <p role="status" className="putty-availability">{boardError || (!board ? 'Loading the hoodie preview…' : '')}</p>
      </section>
      <section className="putty-leaderboard" aria-labelledby={previewHistory ? 'putty-history-heading' : 'putty-leaderboard-heading'}>
        {previewHistory ? <div id={`putty-history-${previewHistory.id}`}>
          <h2 id="putty-history-heading">{previewHistory.id === 'front' ? 'Front left chest' : previewHistory.id} history</h2>
          <ul className="putty-history-list">
            {previewHistory.history.map((owner, index) => <li key={`${owner.name}-${owner.total}-${index}`}>
              <span>{owner.name}</span>
              <span>{formatPrice(owner.total)}</span>
            </li>)}
          </ul>
        </div> : <>
        <h2 id="putty-leaderboard-heading">Leaderboard</h2>
        <p>the most auraful and powerful people.</p>
        {!board && <div className="putty-leaderboard-skeleton" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(row => <div key={row}>{[0, 1, 2, 3].map(cell => <span key={cell} />)}</div>)}
        </div>}
        {Array.isArray(board?.leaderboard) ? board.leaderboard.length ? <div className="putty-leaderboard-table" role="region" aria-labelledby="putty-leaderboard-heading" tabIndex="0">
          <table>
            <caption className="sr-only">Final hoodie placement leaderboard</caption>
            <thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Total</th><th scope="col">claimed</th></tr></thead>
            <tbody>{board.leaderboard.map((entry, index) => <tr className={index < 3 ? 'putty-leaderboard-top' : undefined} key={`${entry.name}-${index}`}>
              <td><span className="putty-leaderboard-rank">{index < 3 ? ['1st', '2nd', '3rd'][index] : index + 1}</span></td>
              <th scope="row">{index < 3 && entry.url ? <a href={puttyPublicUrl(entry.url)} target="_blank" rel="noopener noreferrer">{entry.name}</a> : entry.name}</th>
              <td>{entry.total_paid == null ? '—' : formatPrice(entry.total_paid)}</td>
              <td>{entry.area} {entry.area === 1 ? 'spot' : 'spots'}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>No placements were claimed.</p> : null}
        <p className="putty-leaderboard-help">Questions about your placement or want your link added? <a href="/contact">Send us a message</a> or <a href="mailto:hello@buildingoro.ca">email us</a>.</p>
        </>}
      </section>
    </div>
    <section className="checkout-card putty-card" aria-labelledby="putty-bid-heading">
      <h2 id="putty-bid-heading">late to the party?</h2>
      <p>contact us for custom requests and keep an eye out for future bids!</p>
    </section>
  </div>
}
