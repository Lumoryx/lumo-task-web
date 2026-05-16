import { ComposeBar } from './ComposeBar'
import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

const CHIPS = [
  { en: 'Write a product intro', zh: '写一份产品介绍' },
  { en: 'Reply to emails', zh: '回复邮件' },
  { en: 'Review PRs', zh: '审查代码' },
]

export function TodayEmpty({ lang, t }: Props) {
  return (
    <div className="today-empty fade-in">
      <div className="empty-orb">
        <div className="empty-orb-halo" />
        <div className="empty-orb-ring" />
        <div className="empty-orb-core" />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {t('today.empty_heading')}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>
        {t('today.empty_sub')}
      </p>

      <div style={{ width: '100%', maxWidth: 560 }}>
        <ComposeBar lang={lang} t={t} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {CHIPS.map(c => (
          <span key={c.en} style={{
            padding: '4px 12px', borderRadius: 20,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            fontSize: 12, color: 'var(--text-secondary)', cursor: 'default',
          }}>
            {lang === 'zh' ? c.zh : c.en}
          </span>
        ))}
      </div>
    </div>
  )
}
