import { useState } from 'react'
import { getTaskTitle } from '../../lib/taskHelpers'
import type { Task, Quadrant, AiClassifyResult, Lang } from '../../api/types'

interface Props {
  result: AiClassifyResult
  tasks: Task[]
  lang: Lang
  t: (k: string) => string
  onApply: (overrides: Record<string, Quadrant>) => void
  onCancel: () => void
}

const QUADRANTS: Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4']
const Q_COLOR: Record<string, string> = { Q1: 'selected-q1', Q2: 'selected-q2', Q3: 'selected-q3', Q4: 'selected-q4' }

export function ClassifyConfirmDialog({ result, tasks, lang, t, onApply, onCancel }: Props) {
  const [overrides, setOverrides] = useState<Record<string, Quadrant>>({})

  const counts = result.classifications.reduce((acc, { quadrant, id }) => {
    const q = overrides[id] || quadrant
    acc[q] = (acc[q] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="modal-overlay">
      <div className="modal classify-dialog">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('matrix.classify_title').replace('{n}', String(result.classifications.length))}
          </span>
        </div>

        {/* Summary bar */}
        <div className="classify-summary" style={{ flexShrink: 0 }}>
          {QUADRANTS.map(q => (
            <div key={q} className="classify-sum-item">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${q.toLowerCase()}-color)` }} />
              <span style={{ fontWeight: 600 }}>{q}</span>
              <span>{counts[q] || 0}</span>
            </div>
          ))}
        </div>

        {/* Task list */}
        <div className="classify-task-list">
          {result.classifications.map(({ id, quadrant }) => {
            const task = tasks.find(t => t.id === id)
            if (!task) return null
            const selected = overrides[id] || quadrant
            return (
              <div key={id} className="classify-task-row">
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{getTaskTitle(task, lang)}</span>
                <div className="classify-q-opts">
                  {QUADRANTS.map(q => (
                    <div key={q}
                      className={`classify-q-opt ${selected === q ? Q_COLOR[q] : ''}`}
                      onClick={() => setOverrides(o => ({ ...o, [id]: q }))}
                    >{q}</div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexShrink: 0 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onApply(overrides)}>
            {t('matrix.classify_apply')}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>{t('matrix.classify_cancel')}</button>
        </div>
      </div>
    </div>
  )
}
