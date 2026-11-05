import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

function countImages(directory) {
  let count = 0
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) count += countImages(filePath)
    else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) count += 1
  }
  return count
}

const originalFiles = countImages(path.join(root, 'img'))
const thumbnailFiles = countImages(path.join(root, 'thumbs'))
const stats = {
  originalFiles,
  thumbnailFiles,
  localImageFiles: originalFiles + thumbnailFiles,
}
const output = path.join(root, 'data', 'gallery-stats.json')
fs.writeFileSync(output, `${JSON.stringify(stats, null, 2)}\n`, 'utf8')
console.log(`Gallery stats refreshed: ${originalFiles.toLocaleString('en-US')} originals + ${thumbnailFiles.toLocaleString('en-US')} thumbnails.`)
