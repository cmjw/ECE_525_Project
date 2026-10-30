// Each word is shaded by how much the model's [CLS] attends to it
// can click one to see where it looks in the image.
export default function TokenChips({ tokens, selected, onSelect }) {
  const chip = (on) => ({
    border: '1px solid #d0d0d5',
    borderRadius: 14,
    padding: '4px 10px',
    cursor: 'pointer',
    outline: on ? '2px solid #3a6df0' : 'none',
  })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <button style={{ ...chip(selected === null), background: '#fff' }} onClick={() => onSelect(null)}>
        overall
      </button>
      {tokens.map((t, i) => (
        <button
          key={i}
          style={{ ...chip(selected === i), background: `rgba(255, 140, 0, ${0.1 + 0.7 * t.score})` }}
          onClick={() => onSelect(i)}
        >
          {t.token}
        </button>
      ))}
    </div>
  )
}