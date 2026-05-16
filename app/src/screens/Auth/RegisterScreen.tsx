import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { AuthHero } from './AuthHero'

export function RegisterScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const navigate = useNavigate()
  const { register, continueLocal } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name || !agreed) return
    setLoading(true)
    try {
      await register(email, password, name)
      navigate('/auth/onboarding')
    } finally { setLoading(false) }
  }

  return (
    <div className="page-bg" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="win" style={{ height: 720, maxWidth: 860 }}>
        <div className="win-titlebar">
          <div className="traffic"><i /><i /><i /></div>
          <div className="title">Lumo Task</div>
        </div>
        <div className="auth-layout">
          <AuthHero lang={lang} t={t} />
          <div className="auth-form">
            <div className="auth-form-inner">
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>{t('auth.register')}</h2>

              <form onSubmit={handleRegister}>
                <div className="auth-field">
                  <label className="field-label">{t('auth.nickname')}</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'zh' ? '你的名字' : 'Your name'} />
                </div>
                <div className="auth-field">
                  <label className="field-label">{t('auth.email')}</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="auth-field">
                  <label className="field-label">{t('auth.password')}</label>
                  <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                  <div className={`custom-checkbox ${agreed ? 'checked' : ''}`} onClick={() => setAgreed(v => !v)}>
                    {agreed && <span style={{ fontSize: 10, color: 'var(--text-inverse)' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('auth.terms')}</span>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} disabled={loading || !agreed}>
                  {loading ? (lang === 'zh' ? '创建中…' : 'Creating…') : t('auth.register')}
                </button>
              </form>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('auth.have_account')} </span>
                <Link to="/auth/login" style={{ fontSize: 12, color: 'var(--accent-primary)' }}>{t('auth.login')}</Link>
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
