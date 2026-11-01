import { useEffect, useRef, useState } from 'react'

const SIZE = 448 // canvas pixels
const N = 14 // attention grid
const CELL = SIZE / N

const clip = (x) => Math.max(0, Math.min(1, x))
const jet = (v) => [
  255 * clip(1.5 - Math.abs(4 * v - 3)),
  255 * clip(1.5 - Math.abs(4 * v - 2)),
  255 * clip(1.5 - Math.abs(4 * v - 1)),
]

export default function Heatmap({ imageUrl, values, mask, onMaskChange, tool }) {
  const canvas = useRef(null)
  const painting = useRef(false)
  const maskRef = useRef(mask)
  maskRef.current = mask   // latest mask, so fast drags don't lose cells
  const [img, setImg] = useState(null)
  const [opacity, setOpacity] = useState(0.5)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (!img) return
    const ctx = canvas.current.getContext('2d')

    // Backend pads the X-ray to a square before the model sees it, so draw it the same way.
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

    // Masked cells: darkened with a diagonal line, drawn on top of everything
    mask.forEach((m, k) => {
      if (!m) return
      const x = (k % N) * CELL
      const y = Math.floor(k / N) * CELL
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(x, y, CELL, CELL)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.moveTo(x, y + CELL)
      ctx.lineTo(x + CELL, y)
      ctx.stroke()
    })
  }, [img, values, opacity, mask])

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
    <div>
      <canvas
        ref={canvas}
        width={SIZE}
        height={SIZE}
        style={{ width: '100%', maxWidth: SIZE, background: '#000', cursor: tool === 'off' ? 'default' : 'crosshair', touchAction: 'none' }}
        onPointerDown={(e) => {
          if (tool === 'off') return
          e.currentTarget.setPointerCapture(e.pointerId)
          painting.current = true
          paint(e)
        }}
        onPointerMove={(e) => { if (painting.current) paint(e) }}
        onPointerUp={() => { painting.current = false }}
        onPointerCancel={() => { painting.current = false }}
      />
      <label style={{ display: 'block' }}>
        Overlay opacity{' '}
        <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
      </label>
    </div>
  )
}