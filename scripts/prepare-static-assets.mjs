import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist')
const directories = ['data', 'img', 'thumbs']
const files = ['og-cover.jpg', 'robots.txt', 'sitemap.xml', '_headers']

if (!fs.existsSync(path.join(output, 'index.html'))) {
  throw new Error('Missing dist/index.html. Run the Vite build before preparing static assets.')
}

for (const name of [...directories, ...files]) {
  const source = path.join(root, name)
  const destination = path.join(output, name)
  if (!fs.existsSync(source)) throw new Error(`Missing required static asset: ${name}`)
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
    mode: fs.constants.COPYFILE_FICLONE,
  })
}

let count = 0
let bytes = 0
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      inspect(file)
      continue
    }
    if (!entry.isFile()) continue
    const size = fs.statSync(file).size
    if (size > 25 * 1024 * 1024) {
      throw new Error(`Static asset exceeds Cloudflare's 25 MiB per-file limit: ${path.relative(output, file)}`)
    }
    count += 1
    bytes += size
  }
}
inspect(output)
console.log(`Prepared ${count.toLocaleString('en-US')} production assets (${(bytes / 1024 ** 3).toFixed(2)} GiB), including the local gallery.`)
