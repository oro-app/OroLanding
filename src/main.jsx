import './lib/feedbackSession.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { getRouteFromPath } from './App.jsx'
import '@oro/web/styles.css'
import { injectOroFonts } from './lib/oroFonts.js'

injectOroFonts()

if (getRouteFromPath(window.location.pathname).type === 'creator-trial') {
  const navigation = window.performance.getEntriesByType('navigation')[0]
  if (navigation?.type === 'reload') {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    const { pathname, search, hash } = window.location
    if (hash) window.history.replaceState(window.history.state, '', `${pathname}${search}`)

    const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    scrollToTop()
    window.addEventListener('pageshow', () => {
      window.requestAnimationFrame(() => {
        scrollToTop()
        window.history.scrollRestoration = previousRestoration
      })
    }, { once: true })
  }
}

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}
