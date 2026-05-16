import { useState } from 'react'
import { IconMore, IconCheck } from './icons'
import { TaskActions } from './TaskActions'
import { PomoPips } from './PomoPips'
import { cn } from '../lib/cn'
import { getTaskTitle, getDueLabel, fmtDuration } from '../lib/taskHelpers'
import type { Task, Lang, Quadrant } from '../api/types'

interface Props {
  task: Task
  lang: Lang
  onComplete?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

const QDOT_CLASS: Record<Quadrant | string, string> = {
  Q1: 'qdot qdot-q1', Q2: 'qdot qdot-q2',
  Q3: 'qdot qdot-q3', Q4: 'qdot qdot-q4',
  unclassified: 'qdot qdot-un',
}

export function TaskRow({ task, lang, onComplete, onDelete, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDone = task.completed

  return (
    <div className={cn('row-task', isDone && 'opacity-60')} style={{ position: 'relative' }}>
      <div
        className={cn('task-checkbox', isDone && 'checked')}
        onClick={onComplete}
      >
        {isDone && <IconCheck size={10} />}
      </div>

      <div className="task-body">
        <div className={cn('task-title', isDone && 'done')}>
          {getTaskTitle(task, lang)}
        </div>
        <div className="task-meta">
          <span className={QDOT_CLASS[task.quadrant]} />
          {task.due && (
            <span style={{ color: task.due === 'today' ? 'var(--status-urgent)' : undefined }}>
              {getDueLabel(task.due, lang)}
            </span>
          )}
          {task.duration && <span>{fmtDuration(task.duration, lang)}</span>}
          {task.pomos_total > 0 && (
            <PomoPips done={task.pomos_done} total={task.pomos_total} />
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="task-more" onClick={() => setMenuOpen(v => !v)}>
          <IconMore size={14} />
        </div>
        {menuOpen && (
          <TaskActions
            lang={lang}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
