import React, { useState } from 'react'
import { MatrixCard } from './MatrixCard'
import { IconPlus } from '../../components/icons'
import type { Task, Quadrant, Lang } from '../../api/types'

const Q_CONFIG: Record<Quadrant, { color: string; label: (t: (k: string) => string) => string; sub: (t: (k: string) => string) => string }> = {
  Q1: { color: 'var(--q1-color)', label: t => t('matrix.q1'), sub: t => t('matrix.q1_sub') },
  Q2: { color: 'var(--q2-color)', label: t => t('matrix.q2'), sub: t => t('matrix.q2_sub') },
  Q3: { color: 'var(--q3-color)', label: t => t('matrix.q3'), sub: t => t('matrix.q3_sub') },
  Q4: { color: 'var(--q4-color)', label: t => t('matrix.q4'), sub: t => t('matrix.q4_sub') },
  unclassified: { color: 'var(--text-faint)', label: () => '?', sub: () => '' },
}

interface Props {
  quadrant: Quadrant
  tasks: Task[]
  lang: Lang
  t: (k: string) => string
  onMove: (taskId: string, quadrant: Quadrant) => void
}

export function QuadrantBox({ quadrant, tasks, lang, t, onMove }: Props) {
  const cfg = Q_CONFIG[quadrant]
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onMove(taskId, quadrant)
    setDragOver(false)
  }

  return (
    <div
      className={`q-box ${dragOver ? 'matrix-card-drop-target' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="q-box-accent" style={{ background: cfg.color }} />
      <div className="q-box-header">
        <div>
          <div className="q-box-title">{cfg.label(t)}</div>
          <div className="q-box-sub">{cfg.sub(t)}</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{tasks.length}</span>
      </div>

      <div className="q-box-tasks">
        {tasks.map(task => (
          <MatrixCard key={task.id} task={task} lang={lang} quadrant={quadrant} />
        ))}
      </div>

      <div className="q-add-btn">
        <IconPlus size={12} />{t('matrix.add_task')}
      </div>
    </div>
  )
}
