interface Props {
  progress: number   // 0-1
  currentRound: number
  totalRounds: number
  remainingSeconds: number
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onComplete: () => void
}

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function FocusAtmosphere({ progress, currentRound, totalRounds, remainingSeconds, isPaused, onPause, onResume, onComplete }: Props) {
  const SIZE = 380
  const R_OUTER = 170
  const R_RING = 145
  const cx = SIZE / 2, cy = SIZE / 2
  const circ = 2 * Math.PI * R_RING
  const dashOffset = circ * (1 - progress)

  return (
    <div className="focus-atmosphere" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="atmoHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.15" />
            <stop offset="60%" stopColor="var(--accent-glow)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-dim)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent-primary)" />
          </linearGradient>
        </defs>

        {/* Atmospheric halo */}
        <circle cx={cx} cy={cy} r={R_OUTER} fill="url(#atmoHalo)" className="atmo-breath" />

        {/* Static ring */}
        <circle cx={cx} cy={cy} r={R_RING} fill="none"
          stroke="var(--border-faint)" strokeWidth="1.5" />

        {/* Progress arc */}
        <circle cx={cx} cy={cy} r={R_RING}
          fill="none"
          stroke="url(#progressGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />

        {/* Animated tick mark at progress end */}
        {progress > 0.01 && (
          <circle
            cx={cx + R_RING * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
            cy={cy + R_RING * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
            r={4} fill="var(--accent-primary)"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent-primary))' }}
          />
        )}
      </svg>

      {/* Center content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {currentRound} {' / '} {totalRounds}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {fmtTime(remainingSeconds)}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: 120 }}
            onClick={isPaused ? onResume : onPause}
          >
            {isPaused ? '&#9654; Resume' : '&#9646;&#9646; Pause'}
          </button>
          <button className="btn btn-secondary" onClick={onComplete} style={{ height: 44 }}>
            &#10003;
          </button>
        </div>
      </div>
    </div>
  )
}
