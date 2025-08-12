#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { Jimp, rgbaToInt, intToRGBA, loadFont, HorizontalAlign, VerticalAlign } from 'jimp'
import { SANS_128_WHITE, SANS_64_WHITE, SANS_32_WHITE, SANS_128_BLACK, SANS_64_BLACK, SANS_32_BLACK } from 'jimp/fonts'

const __dirname = path.resolve()
const iconsDir = path.resolve(__dirname, 'public', 'icons')

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function hexToRgb(hex) {
  const s = hex.replace('#', '')
  const bigint = parseInt(s, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

async function loadFontsForSize(size) {
  // Choose the closest built-in Jimp font sizes
  const whiteFont = size >= 512 ? SANS_128_WHITE : size >= 192 ? SANS_64_WHITE : SANS_32_WHITE

  const blackFont = size >= 512 ? SANS_128_BLACK : size >= 192 ? SANS_64_BLACK : SANS_32_BLACK

  const [white, black] = await Promise.all([loadFont(whiteFont), loadFont(blackFont)])

  return { white, black }
}

async function drawCenteredText(img, { size, text = 'GoG' }) {
  const { white, black } = await loadFontsForSize(size)

  // Define a generous text region to center within
  const padding = Math.round(size * 0.12)
  const region = {
    x: padding,
    y: padding,
    w: size - padding * 2,
    h: size - padding * 2,
  }

  // Shadow pass for subtle contrast on bright/dark backgrounds
  const align = { text, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE }
  await img.print({ font: black, x: region.x + 2, y: region.y + 2, text: align, maxWidth: region.w, maxHeight: region.h })
  await img.print({ font: white, x: region.x, y: region.y, text: align, maxWidth: region.w, maxHeight: region.h })
}

async function generateIcon({ size, output, start = '#0b1020', end = '#1f2937', accent = '#60a5fa', withText = true }) {
  const img = new Jimp({ width: size, height: size, color: '#00000000' })

  // Radial gradient background
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)
  const c0 = hexToRgb(start)
  const c1 = hexToRgb(end)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - centerX
      const dy = y - centerY
      const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / maxRadius)
      const r = lerp(c0.r, c1.r, t)
      const g = lerp(c0.g, c1.g, t)
      const b = lerp(c0.b, c1.b, t)
      img.setPixelColor(rgbaToInt(r, g, b, 255), x, y)
    }
  }

  // Subtle inner ring
  const ringRadius = Math.round(size * 0.42)
  const ringThickness = Math.max(2, Math.round(size * 0.02))
  const ringColor = hexToRgb('#ffffff')
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - centerX
      const dy = y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const d = Math.abs(dist - ringRadius)
      if (d <= ringThickness) {
        const base = intToRGBA(img.getPixelColor(x, y))
        const alpha = 0.12
        const r = lerp(base.r, ringColor.r, alpha)
        const g = lerp(base.g, ringColor.g, alpha)
        const b = lerp(base.b, ringColor.b, alpha)
        img.setPixelColor(rgbaToInt(r, g, b, 255), x, y)
      }
    }
  }

  // Accent glow in top-left
  const acc = hexToRgb(accent)
  const glowRadius = Math.round(size * 0.35)
  const glowX = Math.round(size * 0.28)
  const glowY = Math.round(size * 0.28)
  for (let y = Math.max(0, glowY - glowRadius); y < Math.min(size, glowY + glowRadius); y += 1) {
    for (let x = Math.max(0, glowX - glowRadius); x < Math.min(size, glowX + glowRadius); x += 1) {
      const dx = x - glowX
      const dy = y - glowY
      const t = Math.max(0, 1 - (dx * dx + dy * dy) / (glowRadius * glowRadius))
      if (t > 0) {
        const base = intToRGBA(img.getPixelColor(x, y))
        const alpha = 0.18 * t
        const r = lerp(base.r, acc.r, alpha)
        const g = lerp(base.g, acc.g, alpha)
        const b = lerp(base.b, acc.b, alpha)
        img.setPixelColor(rgbaToInt(r, g, b, 255), x, y)
      }
    }
  }

  // Optional logo text overlay
  if (withText) {
    await drawCenteredText(img, { size })
  }

  await img.write(output)
}

async function run() {
  await ensureDir(iconsDir)

  const tasks = [
    generateIcon({ size: 192, output: path.join(iconsDir, 'icon-192.png') }),
    generateIcon({ size: 512, output: path.join(iconsDir, 'icon-512.png') }),
    generateIcon({ size: 96, output: path.join(iconsDir, 'shortcut-lobbies-96.png') }),
    generateIcon({ size: 96, output: path.join(iconsDir, 'shortcut-history-96.png') }),
  ]

  await Promise.all(tasks)
  // Also generate a maskable 512 using a solid background for best results, with text overlay
  const maskablePath = path.join(iconsDir, 'icon-maskable-512.png')
  const maskable = new Jimp({ width: 512, height: 512, color: '#0f172a' })
  await drawCenteredText(maskable, { size: 512 })
  await maskable.write(maskablePath)
}

run().catch((err) => {
  console.error('[generate-pwa-icons] Failed:', err)
  process.exit(1)
})


