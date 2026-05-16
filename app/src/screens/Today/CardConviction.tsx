import { Chip } from '../../components/ui/Chip'
import { getTaskTitle, getBilingualText } from '../../lib/taskHelpers'
import { useTaskStore } from '../../store/taskStore'
import type { AiRecommendation, Lang } from '../../api/types'

interface Props {
  rec: AiRecommendation
  lang: Lang
  t: (k: string) => string
  onStart: () => void
}

export function CardConviction({ rec, lang, t, onStart }: Props) {
  const { task } = rec
  const allTasks = useTaskStore(s => s.tasks)
  const q = task.quadrant === 'unclassified' ? 'Q2' : task.quadrant as any
  const convPct = Math.round((rec.conviction ?? 0.85) * 100)

  return (
    <div className="today-hero-card" style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20,
    }}>
      {/* Left */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Chip variant={q}>{q}</Chip>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          {getTaskTitle(task, lang)}
        </h3>
        <div className="today-ai-reason">
          <span style={{ fontSize: 11, color: 'var(--accent-primary)', marginRight: 6 }}>&#9670;</span>
          {getBilingualText(rec.reason, lang)}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onStart}>
          {t('today.start')}
        </button>
      </div>

      {/* Right: conviction */}
      <div style={{ borderLeft: '1px solid var(--border-faint)', paddingLeft: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
          {t('today.conviction')}
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {convPct}%
        </div>
        <div className="conviction-bar" style={{ marginBottom: 20 }}>
          <div className="conviction-fill" style={{ width: `${convPct}%` }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
          {t('today.why_not')}
        </div>
        {rec.not_now.slice(0, 2).map(item => {
          const other = allTasks.find(t => t.id === item.id)
          if (!other) return null
          return (
            <div key={item.id} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
              <span style={{ color: 'var(--text-faint)' }}>{getTaskTitle(other, lang)}:</span>{' '}
              {getBilingualText(item.reason, lang)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
