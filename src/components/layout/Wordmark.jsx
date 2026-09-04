// The wordmark image is 500x500 with the glyph inset in transparent margin, so it
// is scaled by height and left uncropped.
export default function Wordmark({ size = 'header' }) {
  return (
    <img
      src="/oro-logo.webp"
      alt=""
      className={`oro-wordmark oro-wordmark--${size}`}
      fetchPriority="high"
      decoding="async"
    />
  )
}
