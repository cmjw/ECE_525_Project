// Each word is shaded by how much the model's [CLS] token attends to it.
// Select a word to see where it looks in the image
// Overall returns to the whole-image view.
export default function TokenChips({ tokens, selected, onSelect }) {
  return (
    <div className="chips" role="group" aria-label="Words in the indication">
      <button className="chip" aria-pressed={selected === null} onClick={() => onSelect(null)}>
        Overall
      </button>
      {tokens.map((t, i) => (
        <button
          key={i}
          className="chip"
          aria-pressed={selected === i}
          style={{ background: `rgba(245, 158, 46, ${0.12 + 0.7 * t.score})` }}
          onClick={() => onSelect(i)}
        >
          {t.token}
        </button>
      ))}
    </div>
  )
}
