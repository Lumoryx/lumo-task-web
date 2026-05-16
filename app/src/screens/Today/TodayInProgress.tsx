import { useFocusStore } from '../../store/focusStore'
import { fmtSeconds } from '../../lib/taskHelpers'
import { getTaskTitle } from '../../lib/taskHelpers'
import type { Task, Lang } from '../../api/types'

interface Props { task: Task; lang: Lang; t: (k: string) => string; onResume: () => void }

export function TodayInProgress({ task, lang, t, onResume }: Props) {
  const { remainingSeconds, totalSeconds, currentRound, totalRounds } = useFocusStore()
  const progress = 1 - remainingSeconds / totalSeconds
  const r = 28, cx = 32, cy = 32
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="fade-in" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-edge)', borderRadius: 12, marginBottom: 20 }}>
        <div className="inprogress-ring">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-default)" strokeWidth="3" />
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke="var(--accent-primary)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {currentRound}/{totalRounds}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 2 }}>
            {t('today.inprogress_label')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {getTaskTitle(task, lang)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {fmtSeconds(remainingSeconds)}
          </div>
        </div>

        <button className="btn btn-primary" onClick={onResume}>
          {t('today.inprogress_resume')}
        </button>
      </div>
    </div>
  )
}
