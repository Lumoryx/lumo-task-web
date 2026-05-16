import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useTaskStore } from '../../store/taskStore'

export function LoggedInScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { logout } = useAuthStore()
  const tasks = useTaskStore(s => s.tasks)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="page-bg" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="win" style={{ width: 480, height: 520 }}>
        <div className="win-titlebar">
          <div className="traffic"><i /><i /><i /></div>
          <div className="title">Lumo Task</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 48px', textAlign: 'center' }}>
          <div className="account-avatar" style={{ width: 80, height: 80, fontSize: 28, marginBottom: 20 }}>{initials}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{user?.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.email}</div>
          {user?.plan === 'pro' && (
            <span className="chip chip-ai" style={{ marginBottom: 24 }}>PRO &middot; {lang === 'zh' ? '续费' : 'Renews'} {user.renewsAt}</span>
          )}

          <div className="stat-group" style={{ width: '100%', marginBottom: 32 }}>
            {[
              { label: t('settings.tasks'), value: tasks.filter(t => !t.completed).length },
              { label: t('settings.pomodoros'), value: tasks.reduce((s, t) => s + t.pomos_done, 0) },
              { label: 'Sync', value: 'On', extra: { color: 'var(--status-success)' } },
            ].map(item => (
              <div key={item.label} className="stat">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value" style={item.extra}>{item.value}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 10 }} onClick={() => navigate('/today')}>
            {lang === 'zh' ? '继续使用' : 'Continue to Today'}
          </button>
          <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 10 }} onClick={() => navigate('/settings')}>
            {lang === 'zh' ? '账户设置' : 'Account Settings'}
          </button>
          <button className="btn btn-ghost btn-danger" style={{ width: '100%', fontSize: 12 }}
            onClick={async () => { await logout(); navigate('/auth/login') }}>
            {t('settings.sign_out')}
          </button>
        </div>
      </div>
    </div>
  )
}
