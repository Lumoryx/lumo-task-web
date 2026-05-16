import { useRef } from 'react'
import { IconSearch, IconPlus, IconUser } from '../components/icons'
import { useAuthStore } from '../store/authStore'
import type { Lang } from '../api/types'

interface Props {
  title: string
  sub?: string
  lang: Lang
  t: (k: string) => string
  onQuickAdd: () => void
  onSearchFocus?: () => void
}

export function Topbar({ title, sub, t, onQuickAdd }: Props) {
  const user = useAuthStore(s => s.user)
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="topbar">
      <div className="page-title">{title}</div>
      {sub && <div className="page-sub">{sub}</div>}
      <div className="spacer" />

      <div className="topbar-search" onClick={() => inputRef.current?.focus()}>
        <span className="topbar-search-icon"><IconSearch size={14} /></span>
        <input
          ref={inputRef}
          className="topbar-search-input"
          placeholder={t('topbar.search')}
          readOnly
        />
        <span className="topbar-search-kbd">⌘K</span>
      </div>

      <button className="btn btn-primary" style={{ height: 32, fontSize: 12, padding: '0 12px' }} onClick={onQuickAdd}>
        <IconPlus size={13} />{t('topbar.quick_add')}
      </button>

      <div className="avatar">
        {user?.plan === 'pro' ? <IconUser size={13} /> : initials}
      </div>
    </div>
  )
}
