import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useTaskStore } from '../../store/taskStore'
import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

export function SettingsAccount({ lang, t }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const { logout } = useAuthStore()
  const tasks = useTaskStore(s => s.tasks)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const handleSignOut = async () => {
    await logout()
    navigate('/auth/login')
  }

  return (
    <div>
      <div className="settings-title">{t('settings.account_title')}</div>

      <div className="settings-panel">
        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '身份' : 'Identity'}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="account-avatar">{initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Local User'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email || lang === 'zh' ? '本地用户' : 'Local mode'}</div>
              {user?.plan === 'pro' && (
                <span className="chip chip-ai" style={{ marginTop: 4, display: 'inline-flex' }}>PRO</span>
              )}
            </div>
            <button className="btn btn-secondary" style={{ marginLeft: 'auto', height: 32, fontSize: 12 }}>
              {t('settings.edit')}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '本地数据' : 'Local data'}</div></div>
          <div className="stat-group" style={{ width: 280 }}>
            <div className="stat">
              <div className="stat-label">{t('settings.tasks')}</div>
              <div className="stat-value">{tasks.filter(t => !t.completed).length}</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t('settings.memories')}</div>
              <div className="stat-value">17</div>
            </div>
            <div className="stat">
              <div className="stat-label">{t('settings.pomodoros')}</div>
              <div className="stat-value">{tasks.reduce((s, t) => s + t.pomos_done, 0)}</div>
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '安全' : 'Security'}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ height: 36 }}>{t('settings.change_pw')}</button>
            <button className="btn btn-danger" style={{ height: 36 }} onClick={handleSignOut}>{t('settings.sign_out')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
