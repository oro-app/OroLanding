import { Writable } from 'node:stream'
import { renderToPipeableStream } from 'react-dom/server'
import { StyleSheet } from 'react-native'
import App, { getRouteFromPath } from './App.jsx'

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    let html = ''
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString()
        callback()
      },
    })

    writable.on('finish', () => resolve(html))
    writable.on('error', reject)
    stream.pipe(writable)
  })
}

export function render(pathname) {
  const route = getRouteFromPath(pathname)

  return new Promise((resolve, reject) => {
    let didError = false
    const stream = renderToPipeableStream(
      <App initialRoute={route} />,
      {
        onAllReady() {
          streamToString(stream)
            .then((html) => {
              if (didError) reject(new Error(`SSR failed for ${pathname}`))
              else resolve(html)
            })
            .catch(reject)
        },
        onError(error) {
          didError = true
          reject(error)
        },
      },
    )
  })
}

// react-native-web injects its stylesheet at runtime on the client; for the
// prerendered HTML we extract it once so @oro/ui components aren't unstyled
// before hydration. Call after render() — the sheet accumulates as pages render.
export function getRnwStyleTag() {
  const sheet = StyleSheet.getSheet()
  return `<style id="${sheet.id}">${sheet.textContent}</style>`
}
