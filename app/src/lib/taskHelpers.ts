import type { Task, BilingualText, Lang } from '../api/types'

export function getTaskTitle(task: Task, lang: Lang): string {
  return task.title[lang] || task.title.en || ''
}

export function getBilingualText(field: BilingualText | undefined, lang: Lang): string {
  if (!field) return ''
  return field[lang] || field.en || ''
}

export function getDueLabel(due: string | null | undefined, lang: Lang): string | null {
  if (!due) return null
  const map: Record<string, Record<Lang, string>> = {
    today: { en: 'Today', zh: '今天' },
    tomorrow: { en: 'Tomorrow', zh: '明天' },
    Fri: { en: 'Fri', zh: '周五' },
    'next wk': { en: 'Next wk', zh: '下周' },
  }
  return (map[due]?.[lang]) ?? due
}

export function fmtDuration(mins: number, lang: Lang): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (lang === 'zh') {
    if (h > 0 && m > 0) return `${h} 小时 ${m} 分`
    if (h > 0) return `${h} 小时`
    return `${m} 分钟`
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function fmtSeconds(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
