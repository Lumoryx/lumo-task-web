import { Chip } from '../../components/ui/Chip'
import { getTaskTitle, getBilingualText } from '../../lib/taskHelpers'
import type { AiRecommendation, Task, Lang } from '../../api/types'

interface Props {
  rec: AiRecommendation
  lang: Lang
  t: (k: string) => string
  tasks: Task[]
  onStart: () => void
}

export function CardPath({ rec, lang, t, tasks, onStart }: Props) {
  const { task } = rec
  const q = task.quadrant === 'unclassified' ? 'Q2' : task.quadrant as any
  const nextTask = rec.not_now[0] ? tasks.find(tk => tk.id === rec.not_now[0].id) : null
  const afterTask = rec.not_now[1] ? tasks.find(tk => tk.id === rec.not_now[1].id) : null

  const steps = [
    { label: t('today.now'), task, isActive: true, stepLabel: getBilingualText(rec.next_step, lang) },
    { label: t('today.next'), task: nextTask, isActive: false, stepLabel: '' },
    { label: t('today.after'), task: afterTask, isActive: false, stepLabel: '' },
  ].filter(s => s.task)

  return (
    <div className="today-hero-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', position: 'relative' }}>
      <div className="path-line" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 28 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', marginLeft: -28 }}>
            <div className={`path-dot ${step.isActive ? 'active' : ''}`} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: step.isActive ? 'var(--accent-primary)' : 'var(--text-faint)', marginBottom: 4 }}>
                {step.label}
              </div>
              {step.task && (
                <>
                  <div style={{ fontSize: step.isActive ? 16 : 13, fontWeight: step.isActive ? 700 : 500, color: step.isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {getTaskTitle(step.task, lang)}
                  </div>
                  {step.isActive && (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 10 }}>
                        <Chip variant={q}>{q}</Chip>
                      </div>
                      {step.stepLabel && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>&rarr; {step.stepLabel}</div>}
                      <button className="btn btn-primary" onClick={onStart}>{t('today.start')}</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
