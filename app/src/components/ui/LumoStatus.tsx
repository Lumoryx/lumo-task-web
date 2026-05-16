
interface Props {
  variant?: 'dot' | 'orb' | 'text'
  text?: string
}

export function LumoStatus({ variant = 'dot', text = '' }: Props) {
  if (variant === 'orb') {
    return (
      <div className="lumo-bar">
        <div className="lumo-orb">
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
        </div>
        <span>{text}</span>
      </div>
    )
  }
  if (variant === 'text') {
    return (
      <div className="lumo-bar">
        <span className="lumo-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)' }}>LUMO</span>
        <span className="lumo-text">{text}</span>
      </div>
    )
  }
  return (
    <div className="lumo-bar">
      <div className="lumo-glyph">
        <div className="halo" />
        <div className="core" />
      </div>
      <span>{text}</span>
    </div>
  )
}
