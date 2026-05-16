import { useRef, useEffect } from 'react'
import { IconEdit, IconMove, IconSnooze, IconCopy, IconTrash } from './icons'
import type { Lang } from '../api/types'

interface Props {
  lang: Lang
  onEdit?: () => void
  onMove?: () => void
  onSnooze?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onClose: () => void
}

export function TaskActions({ lang, onEdit, onMove, onSnooze, onDuplicate, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const L = (en: string, zh: string) => lang === 'zh' ? zh : en
  const items = [
    { label: L('Edit', '编辑'), icon: <IconEdit size={13} />, action: onEdit },
    { label: L('Move', '移动'), icon: <IconMove size={13} />, action: onMove },
    { label: L('Snooze', '稍后'), icon: <IconSnooze size={13} />, action: onSnooze },
    { label: L('Duplicate', '复制'), icon: <IconCopy size={13} />, action: onDuplicate },
  ]

  return (
    <div ref={ref} className="popover" style={{ minWidth: 160 }}>
      {items.map(item => (
        <div key={item.label} className="popover-item" onClick={() => { item.action?.(); onClose() }}>
          {item.icon}{item.label}
        </div>
      ))}
      <div className="popover-divider" />
      <div className="popover-item danger" onClick={() => { onDelete?.(); onClose() }}>
        <IconTrash size={13} />{L('Delete', '删除')}
      </div>
    </div>
  )
}
