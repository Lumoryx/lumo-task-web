import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useTaskStore } from '../../store/taskStore'

export function OnboardingScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const { update } = useSettingsStore()
  const { addTask } = useTaskStore()
  const [step, setStep] = useState(0)
  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [selectedDuration, setSelectedDuration] = useState(25)
  const [quietEnabled, setQuietEnabled] = useState(true)

  const STEPS = 3
  const durations = [
    { mins: 15, label: lang === 'zh' ? '15 分钟' : '15 min', desc: lang === 'zh' ? '轻快专注' : 'Sharp & light' },
    { mins: 25, label: lang === 'zh' ? '25 分钟' : '25 min', desc: lang === 'zh' ? '经典番茄 · 推荐' : 'Classic pomodoro · suggested' },
    { mins: 50, label: lang === 'zh' ? '50 分钟' : '50 min', desc: lang === 'zh' ? '深度专注' : 'Deep immersion' },
  ]

  const addOnboardTask = () => {
    if (!taskInput.trim()) return
    setTasks(t => [...t, taskInput.trim()])
    setTaskInput('')
  }

  const finish = async () => {
    update({ pomoDuration: selectedDuration, quietHoursEnabled: quietEnabled })
    for (const title of tasks) {
      await addTask({ title: { en: title, zh: title }, quadrant: 'unclassified', today: true })
    }
    navigate('/today')
  }

  return (
    <div className="page-bg" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="win" style={{ width: 560, height: 520 }}>
        <div className="win-titlebar">
          <div className="traffic"><i /><i /><i /></div>
          <div className="title">Lumo Task</div>
        </div>
        <div style={{ padding: '32px 40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Progress bar */}
          <div className="onboard-progress">
            {Array.from({ length: STEPS }, (_, i) => (
              <div key={i} className={`onboard-step ${i < step ? 'done' : i === step ? 'active' : ''}`} />
            ))}
          </div>

          {step === 0 && (
            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('onboard.step1_title')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{t('onboard.step1_sub')}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="input" style={{ flex: 1 }} value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addOnboardTask()}
                  placeholder={t('onboard.step1_placeholder')} />
                <button className="btn btn-secondary" onClick={addOnboardTask}>+</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tasks.map((tk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-faint)' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-fog)', border: '1px solid var(--accent-edge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--accent-primary)', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{tk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('onboard.step2_title')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{t('onboard.step2_sub')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {durations.map(d => (
                  <div key={d.mins}
                    onClick={() => setSelectedDuration(d.mins)}
                    style={{ padding: '16px 20px', borderRadius: 10, border: `1.5px solid ${selectedDuration === d.mins ? 'var(--accent-primary)' : 'var(--border-default)'}`, background: selectedDuration === d.mins ? 'var(--accent-fog)' : 'var(--bg-surface)', cursor: 'default', transition: 'all 150ms' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: selectedDuration === d.mins ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{d.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t('onboard.step3_title')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{t('onboard.step3_sub')}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lang === 'zh' ? '启用安静时段' : 'Enable quiet hours'}</span>
                <div className={`toggle ${quietEnabled ? 'on' : ''}`} onClick={() => setQuietEnabled(v => !v)}><div className="thumb" /></div>
              </div>
              {quietEnabled && (
                <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border-faint)' }}>
                  <div className="quiet-range">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-primary)' }}>22:00</span>
                    <div className="quiet-range-line" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-primary)' }}>09:00</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/today')}>
              {step === 0 ? t('onboard.skip') : t('onboard.back')}
            </button>
            <button className="btn btn-primary" onClick={() => step < STEPS - 1 ? setStep(s => s + 1) : finish()}>
              {step === STEPS - 1 ? t('onboard.done') : t('onboard.continue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
