import { useState } from 'react'
import { PomoPips } from '../../components/PomoPips'
import { getTaskTitle, getDueLabel, fmtDuration } from '../../lib/taskHelpers'
import { cn } from '../../lib/cn'
import { useTaskStore } from '../../store/taskStore'
import type { Task, Quadrant, Lang } from '../../api/types'

const QDOT_CLASS: Record<string, string> = {
  Q1: 'qdot qdot-q1', Q2: 'qdot qdot-q2',
  Q3: 'qdot qdot-q3', Q4: 'qdot qdot-q4',
  unclassified: 'qdot qdot-un',
}

interface Props { task: Task; lang: Lang; quadrant: Quadrant }

export function MatrixCard({ task, lang, quadrant }: Props) {
  const { completeTask } = useTaskStore()
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={cn('matrix-card', dragging && 'dragging')}
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); setDragging(true) }}
      onDragEnd={() => setDragging(false)}
    >
      <div
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        style={{ marginTop: 1 }}
        onClick={() => completeTask(task.id)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="task-title" style={{ fontSize: 12 }}>{getTaskTitle(task, lang)}</div>
        <div className="task-meta" style={{ marginTop: 3 }}>
          <span className={QDOT_CLASS[quadrant]} />
          {task.due && <span style={{ fontSize: 11 }}>{getDueLabel(task.due, lang)}</span>}
          {task.duration && <span style={{ fontSize: 11 }}>{fmtDuration(task.duration, lang)}</span>}
          <PomoPips done={task.pomos_done} total={task.pomos_total} />
        </div>
      </div>
    </div>
  )
}
