import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { AuthHero } from './AuthHero'

export function LoginScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const { login, continueLocal } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/today')
    } catch (err) {
      setError(lang === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
    } finally { setLoading(false) }
  }

  return (
    <div className="page-bg" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="win" style={{ height: 700, maxWidth: 860 }}>
        <div className="win-titlebar">
          <div className="traffic"><i /><i /><i /></div>
          <div className="title">Lumo Task</div>
        </div>
        <div className="auth-layout">
          <AuthHero lang={lang} t={t} />
          <div className="auth-form">
            <div className="auth-form-inner">
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{t('auth.login')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                {lang === 'zh' ? '欢迎回来' : 'Welcome back'}
              </p>

              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="field-label">{t('auth.email')}</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="auth-field">
                  <label className="field-label">{t('auth.password')}</label>
                  <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                {error && <div style={{ fontSize: 12, color: 'var(--status-urgent)', marginBottom: 12 }}>{error}</div>}
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
                  {loading ? (lang === 'zh' ? '登录中…' : 'Logging in…') : t('auth.login')}
                </button>
              </form>

              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--accent-primary)', cursor: 'default' }}>{t('auth.forgot')}</span>
              </div>

              <div className="auth-divider">{lang === 'zh' ? '或' : 'or'}</div>

              {(['google', 'apple', 'github'] as const).map(provider => (
                <div key={provider} className="oauth-btn" onClick={() => { continueLocal(); navigate('/today') }}>
                  <span style={{ fontSize: 13 }}>
                    {provider === 'google' ? 'G' : provider === 'apple' ? '' : '⌥'}
                  </span>
                  {t(`auth.${provider}` as any)}
                </div>
              ))}

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('auth.no_account')} </span>
                <Link to="/auth/register" style={{ fontSize: 12, color: 'var(--accent-primary)' }}>{t('auth.register')}</Link>
              </div>

              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 12 }}
                onClick={() => { continueLocal(); navigate('/today') }}>
                {t('auth.local')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
