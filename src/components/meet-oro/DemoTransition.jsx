import { useEffect, useRef, useState } from 'react'

export default function DemoTransition() {
  const [departing, setDeparting] = useState(false)
  const navigation = useRef(null)

  useEffect(() => {
    const reset = () => {
      if (navigation.current) {
        clearTimeout(navigation.current.timer)
        navigation.current.link.removeAttribute('data-demo-departing')
        navigation.current = null
      }
      setDeparting(false)
    }
    const onPageShow = event => { if (event.persisted) reset() }
    const onClick = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target.closest?.('a[href]')
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname.replace(/\/+$/, '') !== '/meet-oro') return
      if (window.location.pathname.replace(/\/+$/, '') === '/meet-oro') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      event.preventDefault()
      if (navigation.current) return
      link.setAttribute('data-demo-departing', '')
      setDeparting(true)
      navigation.current = { link, timer: setTimeout(() => window.location.assign(url.href), 300) }
    }
    document.addEventListener('click', onClick)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('pageshow', onPageShow)
      if (navigation.current) {
        clearTimeout(navigation.current.timer)
        navigation.current.link.removeAttribute('data-demo-departing')
        navigation.current = null
      }
    }
  }, [])

  return <div className="oro-demo-transition" data-departing={departing || undefined} aria-hidden="true" />
}
