export function prepareReceiptShare(blob, browser = globalThis.navigator) {
  if (!blob) return null
  if (typeof File === 'undefined') return { file: null, mode: 'download' }
  const file = new File([blob], 'oro-invite-story.png', { type: 'image/png' })
  const ios = /iPhone|iPad|iPod/i.test(browser?.userAgent || '') ||
    (browser?.platform === 'MacIntel' && browser?.maxTouchPoints > 1)
  const android = /Android/i.test(browser?.userAgent || '')
  try {
    if ((ios || android) && typeof browser.share === 'function' && browser.canShare?.({ files: [file] })) {
      return { file, mode: ios ? 'ios' : 'android' }
    }
  } catch { /* Browsers can expose sharing while blocking this file type. */ }
  return { file, mode: 'download' }
}

export async function shareReceiptImage(file, browser = globalThis.navigator) {
  try {
    await browser.share({ files: [file] })
    return 'shared'
  } catch (error) {
    if (error.name === 'AbortError') return 'cancelled'
    throw error
  }
}
