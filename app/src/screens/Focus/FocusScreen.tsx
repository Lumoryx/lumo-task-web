import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFocusStore } from '../../store/focusStore'
import { useTaskStore } from '../../store/taskStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { FocusAtmosphere } from './FocusAtmosphere'
import { FocusComplete } from './FocusComplete'
import { LumoStatus } from '../../components/ui/LumoStatus'
import { Chip } from '../../components/ui/Chip'
import { getTaskTitle, fmtDuration } from '../../lib/taskHelpers'

export function FocusScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const focus = useFocusStore()
  const { tasks, incrementPomos, completeTask } = useTaskStore()

  const task = tasks.find(tk => tk.id === focus.taskId)

  // Redirect if no active session
  useEffect(() => {
    if (!focus.isActive && !focus.showComplete) {
      navigate('/today', { replace: true })
    }
  }, [focus.isActive, focus.showComplete, navigate])

  if (!task) return null

  const progress = 1 - focus.remainingSeconds / focus.totalSeconds
  const q = task.quadrant === 'unclassified' ? 'Q2' : task.quadrant as any

  const handleDoneTask = async () => {
    await completeTask(task.id)
    focus.completeTask()
    navigate('/today')
  }

  const handleAnotherRound = () => {
    incrementPomos(task.id)
    focus.dismissComplete()
  }

  const handleBack = () => {
    focus.exitSession()
    navigate('/today')
  }

  return (
    <div className="focus-screen fade-in" style={{ position: 'relative', width: '100%' }}>
      {/* Top bar */}
      <div className="focus-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Chip variant={q}>{q}</Chip>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getTaskTitle(task, lang)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <LumoStatus variant="dot" text={t('ai.muted')} />
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={handleBack}>
            &larr; {t('focus.complete_back')}
          </button>
        </div>
      </div>

      {/* Main atmosphere */}
      <FocusAtmosphere
        progress={progress}
        currentRound={focus.currentRound}
        totalRounds={focus.totalRounds}
        remainingSeconds={focus.remainingSeconds}
        isPaused={focus.isPaused}
        onPause={focus.pause}
        onResume={focus.resume}
        onComplete={focus.completeRound}
      />

      {/* Meta strip */}
      <div className="focus-meta">
        {task.duration && (
          <div className="focus-meta-item">
            <span className="focus-meta-label">{t('focus.est')}</span>
            <span>{fmtDuration(task.duration, lang)}</span>
          </div>
        )}
        <div className="focus-meta-item">
          <span className="focus-meta-label">{t('focus.pomo_of')}</span>
          <span>{focus.currentRound} / {focus.totalRounds}</span>
        </div>
      </div>

      {/* Complete dialog */}
      {focus.showComplete && (
        <FocusComplete
          lang={lang} t={t}
          currentRound={focus.currentRound}
          totalRounds={focus.totalRounds}
          onDoneTask={handleDoneTask}
          onAnotherRound={handleAnotherRound}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
