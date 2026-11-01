export default function Predictions({ probs }) {
  const rows = Object.entries(probs).sort((a, b) => b[1] - a[1])
  return (
    <div>
      <h2 className="section-title">Model scores</h2>
      <p className="hint">
        Uncalibrated scores (0 to 100).
      </p>
      <ul className="scores">
        {rows.map(([name, p], i) => (
          <li key={name} className="score" data-top={i === 0}>
            <span className="score-name">{name}</span>
            <span className="track">
              <span className="fill" style={{ width: `${p * 100}%` }} />
            </span>
            <span className="score-value">{(p * 100).toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
