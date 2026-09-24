import { build } from 'esbuild'
import { copyFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const destination = `${root}integrations/beta-signup/dist`
await mkdir(destination, { recursive: true })
await build({ entryPoints: [`${root}src/lib/betaContract.js`], bundle: true, format: 'iife', globalName: 'BetaContract', target: 'es2020', minify: true, outfile: `${destination}/BetaContract.gs` })
await copyFile(`${root}integrations/beta-signup/Code.js`, `${destination}/Code.gs`)
await copyFile(`${root}integrations/beta-signup/appsscript.json`, `${destination}/appsscript.json`)
console.log('Apps Script files ready in integrations/beta-signup/dist/')
