import { db } from './db'
import { mockDelay } from './delay'
import type { AiRecommendation, AiClassifyResult, ParsedTask, Quadrant, Lang } from '../types'

// ── Heuristic NLP parser (mirrors web/today.jsx parseNaturalLanguage) ──
const URGENT_WORDS_EN = ['urgent', 'asap', 'today', 'deadline', 'critical', 'now', 'immediately']
const URGENT_WORDS_ZH = ['紧急', '今天', '截止', '马上', '立刻', '现在']
const IMPORTANT_WORDS_EN = ['important', 'key', 'critical', 'essential', 'strategic', 'milestone']
const IMPORTANT_WORDS_ZH = ['重要', '关键', '核心', '战略', '里程碑']

function detectQuadrant(text: string): { q: Quadrant; reason: { en: string; zh: string } } {
  const lower = text.toLowerCase()
  const isUrgent = [...URGENT_WORDS_EN, ...URGENT_WORDS_ZH].some(w => lower.includes(w))
  const isImportant = [...IMPORTANT_WORDS_EN, ...IMPORTANT_WORDS_ZH].some(w => lower.includes(w))
  if (isUrgent && isImportant) return { q: 'Q1', reason: { en: 'Urgent and important', zh: '紧急且重要' } }
  if (!isUrgent && isImportant) return { q: 'Q2', reason: { en: 'Important, not urgent', zh: '重要但不紧急' } }
  if (isUrgent && !isImportant) return { q: 'Q3', reason: { en: 'Urgent, not important', zh: '紧急但不重要' } }
  return { q: 'unclassified', reason: { en: 'Will be classified by AI', zh: 'AI 将帮助分类' } }
}

function parseDue(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes('today') || lower.includes('今天')) return 'today'
  if (lower.includes('tomorrow') || lower.includes('明天')) return 'tomorrow'
  if (lower.includes('friday') || lower.includes('周五')) return 'Fri'
  if (lower.includes('next week') || lower.includes('下周')) return 'next wk'
  return null
}

function parseDuration(text: string): number {
  const minsMatch = text.match(/(\d+)\s*(min|mins|minute|minutes|分钟|分)/i)
  if (minsMatch) return parseInt(minsMatch[1])
  const hrMatch = text.match(/(\d+)\s*(h|hr|hour|hours|小时)/i)
  if (hrMatch) return parseInt(hrMatch[1]) * 60
  return 25
}

export const aiMock = {
  async recommend(): Promise<AiRecommendation> {
    await mockDelay(400, 700)
    const candidate = db.tasks.find(t => t.today && !t.completed && t.quadrant === 'Q1')
      || db.tasks.find(t => t.today && !t.completed)
      || db.tasks[0]

    if (!candidate) throw new Error('No tasks available')

    const notNow = db.tasks
      .filter(t => t.id !== candidate.id && t.today && !t.completed)
      .slice(0, 2)
      .map(t => ({
        id: t.id,
        reason: t.reason || { en: 'Lower priority right now', zh: '当前优先级较低' },
      }))

    return {
      task: candidate,
      conviction: candidate.conviction ?? 0.85,
      reason: candidate.reason ?? { en: 'This task is due today and unblocked.', zh: '该任务今天截止且无依赖。' },
      next_step: candidate.next_step ?? { en: 'Open the task and start the first step', zh: '打开任务，开始第一步' },
      not_now: notNow,
    }
  },

  async classify(taskIds?: string[]): Promise<AiClassifyResult> {
    await mockDelay(500, 800)
    const targets = taskIds
      ? db.tasks.filter(t => taskIds.includes(t.id))
      : db.tasks.filter(t => t.quadrant === 'unclassified')

    const QUADRANT_MAP: Record<string, Quadrant> = {
      't7': 'Q2', 't8': 'Q4',
    }

    const classifications = targets.map(t => {
      const suggested = t.ai_suggest || QUADRANT_MAP[t.id] || 'Q2'
      return {
        id: t.id,
        quadrant: suggested as Quadrant,
        reason: { en: 'Based on keywords and context', zh: '基于关键词和上下文分析' },
      }
    })

    return { classifications }
  },

  async parseText(text: string, _lang: Lang): Promise<ParsedTask> {
    await mockDelay(150, 300)
    const { q, reason } = detectQuadrant(text)
    const due = parseDue(text)
    const duration = parseDuration(text)
    const title = text.length > 60 ? text.substring(0, 60) + '…' : text

    return {
      title: { en: title, zh: title },
      quadrant: q,
      quadrant_reason: reason,
      due,
      duration,
      pomos_total: Math.max(1, Math.ceil(duration / 25)),
    }
  },
}
