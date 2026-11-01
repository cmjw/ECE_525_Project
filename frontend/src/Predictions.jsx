export default function Predictions({ probs }) {
  const rows = Object.entries(probs).sort((a, b) => b[1] - a[1])
  return (
    <div>
      <h3>Model scores</h3>
        <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px' }}>
          These are uncalibrated scores, not probabilities. Classifier trained on about 2.6k Open-i chest x-ray exams (test macro-AUC of about 0.74).
        </p>
      {rows.map(([name, p]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
          <span style={{ width: 130 }}>{name}</span>
          <div style={{ flex: 1, maxWidth: 300, height: 10, background: '#e3e3e8', borderRadius: 5 }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: '#3a6df0', borderRadius: 5 }} />
          </div>
          <span style={{ width: 40, textAlign: 'right' }}>{(p * 100).toFixed(0)}</span>
        </div>
      ))}
    </div>
  )
}