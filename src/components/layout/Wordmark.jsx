// The wordmark PNG is 500x500 with the glyph inset in transparent margin, so it
// is scaled by height and left uncropped.
export default function Wordmark({ size = 'header' }) {
  return (
    <img
      src="/static/oro-logo.png"
      alt="oro"
      className={`oro-wordmark oro-wordmark--${size}`}
      fetchpriority="high"
      decoding="async"
    />
  )
}
