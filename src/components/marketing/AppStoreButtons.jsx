import { APP_STORE_URL, PLAY_STORE_URL } from '../../lib/links'
import './AppStoreButtons.css'

// Bespoke App Store + Google Play buttons. NOT Apple's / Google's official
// brand badges — those are bound by brand guidelines and clash with this
// site's editorial voice. The italic-serif treatment + simplified inline-SVG
// icons are intentional per the /try-oro handoff (and explicitly called out
// at handoff README line 163).
//
// Both are real links that open in a new tab.

function AppleIcon() {
  return (
    <svg width="26" height="30" viewBox="0 0 24 28" fill="currentColor" aria-hidden="true">
      <path d="M16.8 14.85c-.02-2.6 2.13-3.86 2.22-3.92-1.21-1.77-3.1-2.02-3.77-2.04-1.6-.16-3.13.94-3.95.94-.83 0-2.07-.92-3.42-.9-1.74.03-3.37 1.04-4.27 2.6-1.84 3.18-.47 7.88 1.31 10.47.88 1.27 1.91 2.69 3.27 2.64 1.32-.05 1.82-.85 3.41-.85 1.59 0 2.05.85 3.44.82 1.43-.02 2.32-1.28 3.18-2.56.4-.59.7-1.18.95-1.77-2.16-.83-3.27-2.66-3.37-4.43zM14.32 6.95c.72-.88 1.21-2.1 1.07-3.32-1.04.04-2.3.7-3.05 1.56-.67.77-1.27 2.02-1.11 3.21 1.17.09 2.36-.58 3.09-1.45z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="24" height="28" viewBox="0 0 24 26" fill="none" aria-hidden="true">
      <path d="M3.6 1.7c-.4.4-.6 1-.6 1.8v19c0 .8.2 1.4.6 1.8l.1.1L14.4 13.5v-.2L3.7 1.6l-.1.1z" fill="currentColor" opacity=".75" />
      <path d="M18 17.1l-3.6-3.6v-.2L18 9.7l.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5L18 17.1z" fill="currentColor" />
      <path d="M18.1 17l-3.7-3.7L3.6 24c.4.4 1.1.5 1.8.1L18.1 17" fill="currentColor" opacity=".55" />
      <path d="M18.1 9.8L5.4 2.6c-.7-.4-1.4-.3-1.8.1l10.8 10.7L18.1 9.8z" fill="currentColor" opacity=".9" />
    </svg>
  )
}

export default function AppStoreButtons({ onAppStoreClick, onPlayStoreClick }) {
  return (
    <div className="appstore-buttons">
      <a
        className="appstore-btn appstore-btn--filled"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onAppStoreClick}
      >
        <AppleIcon />
        <div className="appstore-btn-labels">
          <span className="appstore-btn-small">download on the</span>
          <span className="appstore-btn-name">app store</span>
        </div>
      </a>

      <a
        className="appstore-btn appstore-btn--outlined"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onPlayStoreClick}
      >
        <PlayIcon />
        <div className="appstore-btn-labels">
          <span className="appstore-btn-small">get it on</span>
          <span className="appstore-btn-name">google play</span>
        </div>
      </a>
    </div>
  )
}
