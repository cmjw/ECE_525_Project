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

const TOOLS = [
  { id: 'off', label: 'View' },
  { id: 'draw', label: 'Mask' },
  { id: 'erase', label: 'Unmask' },
]

// Check alignment
const TEST_GRID = Array.from({ length: 196 }, (_, k) => {
  const row = Math.floor(k / 14)
  const col = k % 14
  return row < 3 && col < 3 ? 1 : row === 0 && col < 9 ? 0.5 : 0
})

const emptyMask = () => Array(196).fill(false) // true = this 14x14 cell is masked
const IDLE = { state: 'idle', message: '' }

export default function App() {
  const [file, setFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState(null) // clicked word index; null = overall map
  const [status, setStatus] = useState(IDLE)
  const [testPattern, setTestPattern] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [mask, setMask] = useState(emptyMask)
  const [tool, setTool] = useState('off') // 'off' | 'draw' | 'erase'
  const [opacity, setOpacity] = useState(0.5)

  // Process file upload
  const onFile = (f) => {
    if (!f) return
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      setStatus({ state: 'error', message: 'Use a PNG or JPEG image.' })
      return
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(f)
    setImageUrl(URL.createObjectURL(f))
    setMask(emptyMask())
    setSelected(null)
    setStatus(IDLE)
  }

  useEffect(() => {
    if (!file) return
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus({ state: 'running', message: 'Running the model…' })
      const body = new FormData()
      body.append('image', file)
      body.append('text', text)
      body.append('patch_mask', mask.map((m) => (m ? '1' : '0')).join(''))
      try {
        const res = await fetch('/api/predict', { method: 'POST', body, signal: ctrl.signal })
        if (!res.ok) {
          const detail = (await res.json().catch(() => null))?.detail
          throw new Error(
            detail ||
              (res.status >= 500
                ? 'The model server returned an error. Check that the backend is running on port 8000, and read its terminal output.'
                : res.statusText),
          )
        }
        const data = await res.json()
        setResult(data)
        setSelected((s) => (s !== null && s < data.tokens.length ? s : null))
        setStatus(IDLE)
      } catch (e) {
        if (e.name === 'AbortError') return
        const unreachable = /fetch|network/i.test(e.message)
        setStatus({
          state: 'error',
          message: unreachable ? "Can't reach the model server. Start the backend on port 8000, then change anything to retry." : e.message,
        })
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [file, text, mask])

  const maskedCount = mask.filter(Boolean).length
  const map = result && (selected === null ? result.image_attention : result.token_attention[selected])
  const values = testPattern ? TEST_GRID : map
  const caption = result && (selected === null ? 'Overall attention' : `Where "${result.tokens[selected].token}" looks`)
  const raw = result && {
    ...result,
    image_attention: `[${result.image_attention.length} values]`,
    token_attention: `[${result.token_attention.length} maps]`,
  }

  const filePicker = (className, label) => (
    <label className={className}>
      {label}
      <input
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          onFile(e.target.files[0])
          e.target.value = '' // allow choosing the same file again
        }}
      />
    </label>
  )

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1 className="title">Multimodal Medical Attention Visualizer</h1>
          <p className="lede">
            ECE 425/525 Project by Tatiana Rastoskueva, Kaycee Ridenhour, and Charlotte White.
            Uses a multimodal model, BiomedCLIP, which we pretrained on chest x-rays from the Open-i dataset with a trained fusion head, to visualize and demonstrate attention in medical findings prediction.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Page">
          <button className="seg-button" aria-pressed={!showGuide} onClick={() => setShowGuide(false)}>
            Viewer
          </button>
          <button className="seg-button" aria-pressed={showGuide} onClick={() => setShowGuide(true)}>
            How it works
          </button>
        </div>
      </header>

      {showGuide ? (
        <main className="guide">
          <p className="lede">The following are short animations of each stage for the architecture, from the image patches to the final classification.</p>
          {VIDEOS.map(({ title, src }) => (
            <section key={title}>
              <h2 className="section-title">{title}</h2>
              <video className="guide-media" controls playsInline preload="metadata">
                <source src={src} type="video/mp4" />
                Your browser does not support MP4 video.
              </video>
            </section>
          ))}
          <section>
            <h2 className="section-title">Classification</h2>
            <img className="guide-media" src="/classification.png" alt="Diagram of the classification stage" />
          </section>
        </main>
      ) : (
        <>
          <main className="workspace">
            <section className="viewer" aria-label="X-ray viewer">
              <div
                className="film"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  onFile(e.dataTransfer.files[0])
                }}
              >
                {imageUrl ? (
                  <Heatmap imageUrl={imageUrl} values={values} mask={mask} onMaskChange={setMask} tool={tool} opacity={opacity} />
                ) : (
                  <label className="drop">
                    <span className="drop-title">Add a chest X-ray</span>
                    <span className="drop-hint">Drop a PNG or JPEG here, or choose a file.</span>
                    <input
                      className="visually-hidden"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => {
                        onFile(e.target.files[0])
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>

              {imageUrl && (
                <>
                  <div className="toolbar">
                    <div className="seg" role="group" aria-label="Mask tool">
                      {TOOLS.map((t) => (
                        <button key={t.id} className="seg-button" aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <button className="btn" onClick={() => setMask(emptyMask())} disabled={maskedCount === 0}>
                      Clear mask
                    </button>
                    {filePicker('btn', 'Replace image')}
                  </div>
                  <p className="meta">
                    {maskedCount} of 196 cells masked. Masked cells are hidden from the model's attention.
                  </p>

                  <div className="overlay-row">
                    <label htmlFor="overlay">Overlay</label>
                    <input
                      id="overlay"
                      className="overlay-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(+e.target.value)}
                    />
                    <span className="legend">
                      less
                      <span className="ramp" aria-hidden="true" />
                      more attention
                    </span>
                  </div>
                  {caption && <p className="caption">{caption}</p>}
                </>
              )}
            </section>

            <section className="side" aria-label="Inputs and results">
              {result?.mock && <p className="banner">Mock model is on: scores and maps are random.</p>}

              <div>
                <label className="section-title" htmlFor="indication">
                  Clinical indication
                </label>
                <p className="hint">Enter up to 64 tokens.</p>
                <textarea
                  id="indication"
                  className="field"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    setSelected(null)
                  }}
                  placeholder="For example: shortness of breath, decreased breath sounds on the right"
                />
                <p className="status" role="status" data-state={status.state}>
                  {status.message}
                </p>
              </div>

              {result ? (
                <div className="results" data-stale={status.state === 'error'}>
                  <Predictions probs={result.probs} />
                  <div>
                    <h2 className="section-title">Words</h2>
                    <p className="hint">
                      Shading shows how much the model attends to each word. Select a word to see where it looks in the image.
                    </p>
                    <TokenChips tokens={result.tokens} selected={selected} onSelect={setSelected} />
                  </div>
                </div>
              ) : (
                <p className="placeholder">Scores and word attention appear here once an X-ray is added.</p>
              )}
            </section>
          </main>

          <details className="debug">
            <summary className="debug-summary">Debug tools</summary>
            <label className="check">
              <input type="checkbox" checked={testPattern} onChange={(e) => setTestPattern(e.target.checked)} /> Show alignment
              test pattern
            </label>
            {raw && <pre className="raw">{JSON.stringify(raw, null, 2)}</pre>}
          </details>
        </>
      )}

      <footer className="colophon">ECE 425/525 Project. Tatiana Rastoskueva, Kaycee Ridenhour, and Charlotte White.</footer>
    </div>
  )
}
