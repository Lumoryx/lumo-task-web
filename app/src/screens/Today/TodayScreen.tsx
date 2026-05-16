import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useTaskStore } from '../../store/taskStore'
import { useFocusStore } from '../../store/focusStore'
import { aiApi } from '../../api/ai'
import { LumoStatus } from '../../components/ui/LumoStatus'
import { TaskRow } from '../../components/TaskRow'
import { CardClassic } from './CardClassic'
import { CardConviction } from './CardConviction'
import { CardPath } from './CardPath'
import { ComposeBar } from './ComposeBar'
import { TodayEmpty } from './TodayEmpty'
import { TodayInProgress } from './TodayInProgress'
import type { AiRecommendation } from '../../api/types'

type CardVariant = 'classic' | 'conviction' | 'path'

export function TodayScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const { tasks, completed, completeTask, deleteTask } = useTaskStore()
  const focusStore = useFocusStore()
  const pomoDuration = useSettingsStore(s => s.pomoDuration)

  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null)
  const [loadingRec, setLoadingRec] = useState(true)
  const [cardVariant] = useState<CardVariant>('classic')

  const todayTasks = tasks.filter(t => t.today && !t.completed)
  const completedToday = [...completed, ...tasks.filter(t => t.completed && t.today)]

  useEffect(() => {
    if (todayTasks.length === 0) { setLoadingRec(false); return }
    aiApi.recommend().then(rec => { setRecommendation(rec); setLoadingRec(false) }).catch(() => setLoadingRec(false))
  }, []) // eslint-disable-line

  const handleStart = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    focusStore.startSession(taskId, pomoDuration, task.pomos_total || 4)
    navigate('/focus')
  }

  const aiStatusText = loadingRec ? t('ai.thinking') : t('ai.ready')

  // Empty state
  if (todayTasks.length === 0 && completedToday.length === 0) {
    return <TodayEmpty lang={lang} t={t} />
  }

  // In progress state
  if (focusStore.isActive) {
    const activeTask = tasks.find(tk => tk.id === focusStore.taskId)
    if (activeTask) return <TodayInProgress task={activeTask} lang={lang} t={t} onResume={() => navigate('/focus')} />
  }

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 800 }}>
      {/* AI status bar */}
      <div style={{ marginBottom: 16 }}>
        <LumoStatus variant="dot" text={aiStatusText} />
      </div>

      {/* Recommendation card */}
      {recommendation && !loadingRec && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 10 }}>
            {t('today.recommended')}
          </div>
          {cardVariant === 'classic' && (
            <CardClassic rec={recommendation} lang={lang} t={t}
              onStart={() => handleStart(recommendation.task.id)}
              onSkip={() => setRecommendation(null)} />
          )}
          {cardVariant === 'conviction' && (
            <CardConviction rec={recommendation} lang={lang} t={t}
              onStart={() => handleStart(recommendation.task.id)} />
          )}
          {cardVariant === 'path' && (
            <CardPath rec={recommendation} lang={lang} t={t} tasks={tasks}
              onStart={() => handleStart(recommendation.task.id)} />
          )}
        </>
      )}

      {/* Today task list */}
      {todayTasks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-h">{t('today.list')}</div>
          {todayTasks.filter(tk => tk.id !== recommendation?.task.id).map(task => (
            <TaskRow key={task.id} task={task} lang={lang}
              onComplete={() => completeTask(task.id)}
              onDelete={() => deleteTask(task.id)} />
          ))}
        </div>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-h">{t('today.completed')}</div>
          {completedToday.slice(0, 5).map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-faint)', opacity: 0.5 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-fog)', border: '1.5px solid var(--accent-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: 'var(--accent-primary)' }}>&#10003;</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through', flex: 1 }}>
                {typeof item.title === 'string' ? item.title : (item.title[lang] || item.title.en)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Compose bar */}
      <div style={{ marginTop: 28 }}>
        <ComposeBar lang={lang} t={t} />
      </div>
    </div>
  )
}
