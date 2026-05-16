import { getTaskTitle } from '../../lib/taskHelpers'
import type { Task, Lang } from '../../api/types'

interface Props {
  tasks: Task[]
  lang: Lang
  t: (k: string) => string
  onClassify: () => void
}

export function UnclassifiedStrip({ tasks, lang, t, onClassify }: Props) {
  return (
    <div className="unclassified-strip">
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
        {t('matrix.unclassified')}
      </span>
      {tasks.slice(0, 4).map(task => (
        <div key={task.id} className="unclassified-pill">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-faint)' }} />
          {getTaskTitle(task, lang)}
        </div>
      ))}
      {tasks.length > 4 && (
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>+{tasks.length - 4}</span>
      )}
      <button className="btn btn-secondary" style={{ marginLeft: 'auto', fontSize: 11, height: 28 }} onClick={onClassify}>
        &#9881; {t('matrix.ai_classify')}
      </button>
    </div>
  )
}
