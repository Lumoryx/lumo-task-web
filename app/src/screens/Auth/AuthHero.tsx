import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

export function AuthHero({ lang: _lang, t }: Props) {
  return (
    <div className="auth-hero">
      <div className="auth-hero-grid" />
      <div className="auth-hero-glow" />

      {/* Mock focus ring */}
      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 32 }}>
        <svg width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="78" fill="url(#halo)" className="atmo-breath" />
          <circle cx="80" cy="80" r="62" fill="none" stroke="var(--accent-edge)" strokeWidth="1" />
          <circle cx="80" cy="80" r="62" fill="none"
            stroke="var(--accent-primary)" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="390" strokeDashoffset="165"
            transform="rotate(-90 80 80)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>2 / 4</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>18:42</div>
          <div style={{ fontSize: 10, color: 'var(--accent-primary)', marginTop: 2 }}>Q1</div>
        </div>
      </div>

      <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.4, marginBottom: 20, maxWidth: 260 }}>
        {t('auth.tagline')}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'stretch' }}>
        {(['auth.bullet1', 'auth.bullet2', 'auth.bullet3'] as const).map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0, marginTop: 5 }} />
            {t(key as any)}
          </div>
        ))}
      </div>
    </div>
  )
}
