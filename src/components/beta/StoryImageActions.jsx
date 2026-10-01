import { useMemo, useState } from 'react'
import { Button } from 'oro-kit'
import { downloadReceiptStory } from './receiptStory'
import { prepareReceiptShare, shareReceiptImage } from './receiptShare'

export default function StoryImageActions({ blob, failed, onRetry }) {
  const prepared = useMemo(() => prepareReceiptShare(blob), [blob])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const mode = prepared?.mode || 'download'
  const label = mode === 'ios' ? 'save to photos' : mode === 'android' ? 'save or share image' : 'download image'

  function download() {
    try { downloadReceiptStory(blob); setMessage('download started.') }
    catch { setMessage('couldn’t download the image. please try again.') }
  }

  async function save() {
    if (busy) return
    setMessage('')
    if (!prepared) { onRetry(); return }
    if (mode === 'download') { download(); return }
    setBusy(true)
    try { await shareReceiptImage(prepared.file) }
    catch { setMessage('couldn’t open the share menu. try downloading instead.') }
    finally { setBusy(false) }
  }

  return <div className="beta-story-actions">
    <Button variant="secondary" onClick={save} disabled={busy || (!blob && !failed)}>
      {!blob ? failed ? 'try again' : 'preparing image…' : busy ? 'opening…' : label}
    </Button>
    {mode !== 'download' && <>
      <p className="beta-story-save-help">{mode === 'ios' ? 'choose “save image” in the menu that opens.' : 'choose an app to save or share your image.'}</p>
      <button type="button" className="beta-resend" onClick={download} disabled={busy}>download instead</button>
    </>}
    <p className="beta-story-save-help" role="status">{message}</p>
  </div>
}
