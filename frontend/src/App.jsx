import { useEffect, useState } from 'react'
import Heatmap from './Heatmap'
import Predictions from './Predictions'
import TokenChips from './TokenChips'

const VIDEOS = [
  { title: 'Vision Transformer Patches', src: '/videos/vision_transformer_patches.mp4' },
  { title: 'Vision Transformer Embeddings', src: '/videos/vision_transformer_embedding.mp4' },
  { title: 'Tokenization', src: '/videos/tokenization.mp4' },
  { title: 'Multimodal Transformer', src: '/videos/multimodal_transformer.mp4' },
]

// A known pattern for checking alignment: bright 3x3 block in the top-left, dimmer strip along the top row.
const TEST_GRID = Array.from({ length: 196 }, (_, k) => {
  const row = Math.floor(k / 14)
  const col = k % 14
  return row < 3 && col < 3 ? 1 : row === 0 && col < 9 ? 0.5 : 0
})

export default function App() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState(null) 
  const [status, setStatus] = useState('')
  const [testPattern, setTestPattern] = useState(false)
  const [showEmptyPage, setShowEmptyPage] = useState(false)

  const onFile = (f) => {
    if (!f) return
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(f)
    setImageUrl(URL.createObjectURL(f))
  }

  useEffect(() => {
    if (!file) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('running…')
      const body = new FormData()
      body.append('image', file)
      body.append('text', text)
      try {
        const res = await fetch('/api/predict', { method: 'POST', body, signal: ctrl.signal })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText)
        setResult(await res.json())
        setSelected(null)
        setStatus('')
      } catch (e) {
        if (e.name !== 'AbortError') setStatus('error: ' + e.message)
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [file, text])

  const map = result && (selected === null ? result.image_attention : result.token_attention[selected])
  const values = testPattern ? TEST_GRID : map
  const caption = result && (selected === null ? 'Overall attention' : `Where "${result.tokens[selected].token}" looks`)
  const raw = result && {
    ...result,
    image_attention: `[${result.image_attention.length} values]`,
    token_attention: `[${result.token_attention.length} maps]`,
  }

  return (
    <div style={{ padding: 16, minHeight: '100vh', fontFamily: 'sans-serif', maxWidth: 1000 }}>
      <header style={{ display: 'flex', alignItems: 'left', gap: 16, marginBottom: 16, padding: 0 }}>
        <button style={{ backgroundColor: '#8a4b00', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer' }} onClick={() => setShowEmptyPage(!showEmptyPage)}>
          {showEmptyPage ? 'Return to main page' : 'Open description page'}
        </button>
      </header>
       <p style={{ color: '#8a4b00', margin: 0 }}>ECE 525 Project</p>

      {showEmptyPage ? (
        <main style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {VIDEOS.map(({ title, src }) => (
            <section key={title}>
              <h2>{title}</h2>
              <video controls playsInline style={{ display: 'block', width: '100%' }}>
                <source src={src} type="video/mp4" />
                Your browser does not support MP4 video.
              </video>
            </section>
          ))}
          <section>
            <h2>Classification</h2>
            <img src="/classification.png" alt="Classification" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
          </section>
        </main>
      ) : (
        <>
          {result?.mock && <p style={{ color: '#b00020', fontWeight: 600 }}>Mock model: outputs are random, not real predictions.</p>}

          <input type="file" accept="image/png,image/jpeg" onChange={(e) => onFile(e.target.files[0])} />
          <br />
          <textarea rows={3} cols={60} value={text} onChange={(e) => setText(e.target.value)} placeholder="Clinical indication" />
          <label style={{ display: 'block' }}>
            <input type="checkbox" checked={testPattern} onChange={(e) => setTestPattern(e.target.checked)} /> Show alignment test pattern
          </label>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 320px', maxWidth: 448 }}>
              {imageUrl && <Heatmap imageUrl={imageUrl} values={values} />}
              <p>{caption}</p>
            </div>
            <div style={{ flex: '1 1 320px' }}>
              <p>{status}</p>
              {result && (
                <>
                  <Predictions probs={result.probs} />
                  <h3>Indication text (click a word)</h3>
                  <TokenChips tokens={result.tokens} selected={selected} onSelect={setSelected} />
                </>
              )}
            </div>
          </div>

          <details>
            <summary>Raw response</summary>
            <pre>{raw && JSON.stringify(raw, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  )
}