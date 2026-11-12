import { execFileSync } from 'node:child_process'
import { access, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const archive = new URL('../vendor/oro-design-system.tar.gz', import.meta.url)
const output = new URL('../dist/design-system/', import.meta.url)

await mkdir(output, { recursive: true })
execFileSync('tar', ['-xzf', fileURLToPath(archive), '-C', fileURLToPath(output)], { stdio: 'inherit' })
await access(new URL('index.html', output))
