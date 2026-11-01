import { useEffect, useRef, useState } from 'react'

const SIZE = 560 // canvas pixels; 560 / 14 = 40 px per attention cell
const N = 14 // attention grid is N x N
const CELL = SIZE / N

const clip = (x) => Math.max(0, Math.min(1, x))

// Colours for attention heatmap
const STOPS = [[0, 0, 4], [87, 16, 110], [188, 55, 84], [249, 142, 9], [252, 255, 164]]
const jet = (v) => [
  255 * clip(1.5 - Math.abs(4 * v - 3)),
  255 * clip(1.5 - Math.abs(4 * v - 2)),
  255 * clip(1.5 - Math.abs(4 * v - 1)),
]

export default function Heatmap({ imageUrl, values, mask, onMaskChange, tool, opacity }) {
  const canvas = useRef(null)
  const painting = useRef(false)
  const maskRef = useRef(mask)
  maskRef.current = mask 
  const [img, setImg] = useState(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (!img) return
    const ctx = canvas.current.getContext('2d')

    // The backend pads the X-ray to a square before the model sees it, so draw it the same way.
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, SIZE, SIZE)
    const s = Math.min(SIZE / img.width, SIZE / img.height)
    const w = img.width * s
    const h = img.height * s
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)

    if (values) {
      const small = document.createElement('canvas')
      small.width = small.height = N
      const sctx = small.getContext('2d')
      const px = sctx.createImageData(N, N)
      values.forEach((v, k) => px.data.set([...jet(v), 255], 4 * k))
      sctx.putImageData(px, 0, 0)

      ctx.globalAlpha = opacity
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(small, 0, 0, SIZE, SIZE)
      ctx.globalAlpha = 1
    }

    // Draw cell grid while a mask tool is active
    if (tool !== 'off') {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i < N; i++) {
        ctx.moveTo(i * CELL, 0)
        ctx.lineTo(i * CELL, SIZE)
        ctx.moveTo(0, i * CELL)
        ctx.lineTo(SIZE, i * CELL)
      }
      ctx.stroke()
    }

    // Masked cells: darkened with a diagonal line, drawn on top of everything
    mask.forEach((m, k) => {
      if (!m) return
      const x = (k % N) * CELL
      const y = Math.floor(k / N) * CELL
      ctx.fillStyle = 'rgba(13,16,19,0.62)'
      ctx.fillRect(x, y, CELL, CELL)
      ctx.strokeStyle = 'rgba(231,236,239,0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x + 4, y + CELL - 4)
      ctx.lineTo(x + CELL - 4, y + 4)
      ctx.stroke()
    })
  }, [img, values, opacity, mask, tool])

  const paint = (e) => {
    const r = canvas.current.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * N)
    const y = Math.floor(((e.clientY - r.top) / r.height) * N)
    if (x < 0 || y < 0 || x >= N || y >= N) return
    const k = y * N + x
    const v = tool === 'draw'
    if (maskRef.current[k] === v) return
    const next = maskRef.current.slice()
    next[k] = v
    maskRef.current = next
    onMaskChange(next)
  }

  return (
    <canvas
      ref={canvas}
      className="canvas"
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="Medical image with attention overlay"
      style={{ cursor: tool === 'off' ? 'default' : 'crosshair', touchAction: tool === 'off' ? 'auto' : 'none' }}
      onPointerDown={(e) => {
        if (tool === 'off') return
        e.currentTarget.setPointerCapture(e.pointerId)
        painting.current = true
        paint(e)
      }}
      onPointerMove={(e) => {
        if (painting.current) paint(e)
      }}
      onPointerUp={() => {
        painting.current = false
      }}
      onPointerCancel={() => {
        painting.current = false
      }}
    />
  )
}
