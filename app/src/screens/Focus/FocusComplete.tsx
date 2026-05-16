import type { Lang } from '../../api/types'

interface Props {
  lang: Lang
  t: (k: string) => string
  currentRound: number
  totalRounds: number
  onDoneTask: () => void
  onAnotherRound: () => void
  onBack: () => void
}

export function FocusComplete({ lang, t, currentRound, totalRounds, onDoneTask, onAnotherRound, onBack }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ padding: 32, width: 360, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-fog)', border: '1.5px solid var(--accent-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
          &#10003;
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {t('focus.complete_heading')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          {lang === 'zh' ? `完成了第 ${currentRound} 轮，共 ${totalRounds} 轮` : `Round ${currentRound} of ${totalRounds} complete`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onDoneTask}>
            {t('focus.complete_task_done')}
          </button>
          {currentRound < totalRounds && (
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onAnotherRound}>
              {t('focus.complete_another')}
            </button>
          )}
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onBack}>
            {t('focus.complete_back')}
          </button>
        </div>
      </div>
    </div>
  )
}
