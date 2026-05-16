import { Chip } from '../../components/ui/Chip'
import { PomoPips } from '../../components/PomoPips'
import { getTaskTitle, getBilingualText, getDueLabel, fmtDuration } from '../../lib/taskHelpers'
import type { AiRecommendation, Lang } from '../../api/types'

interface Props {
  rec: AiRecommendation
  lang: Lang
  t: (k: string) => string
  onStart: () => void
  onSkip: () => void
}

export function CardClassic({ rec, lang, t, onStart, onSkip }: Props) {
  const { task } = rec
  const q = task.quadrant === 'unclassified' ? 'Q2' : task.quadrant as any

  return (
    <div className="today-hero-card" style={{
      background: `linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)`,
      border: '1px solid var(--border-default)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Chip variant={q}>{q}</Chip>
        {task.due && <span style={{ fontSize: 11, color: task.due === 'today' ? 'var(--status-urgent)' : 'var(--text-muted)' }}>{getDueLabel(task.due, lang)}</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.duration && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDuration(task.duration, lang)}</span>}
          <PomoPips done={task.pomos_done} total={task.pomos_total} />
        </div>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 10 }}>
        {getTaskTitle(task, lang)}
      </h3>

      {/* Desc */}
      {task.desc && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
          {getBilingualText(task.desc, lang)}
        </p>
      )}

      {/* AI reason */}
      <div className="today-ai-reason">
        <span style={{ fontSize: 11, color: 'var(--accent-primary)', marginRight: 6 }}>&#9670;</span>
        {getBilingualText(rec.reason, lang)}
      </div>

      {/* Next step */}
      {rec.next_step && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 16 }}>
          &#8594; {getBilingualText(rec.next_step, lang)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={onStart}>
          {t('today.start')}
        </button>
        <button className="btn btn-secondary" onClick={onSkip}>{t('today.skip')}</button>
        <button className="btn btn-ghost">{t('today.later')}</button>
      </div>
    </div>
  )
}
