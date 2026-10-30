import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(JSON.stringify(d)))
      .catch((e) => setHealth('error: ' + e.message))
  }, [])

  return <p>Backend: {health}</p>
}