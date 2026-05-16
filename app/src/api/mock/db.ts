import type { Task, CompletedTask, UserProfile, AppSettings } from '../types'


// ── Seed data (from web/data.jsx) ────────────────────────────────────
const SEED_TASKS: Task[] = [
  {
    id: 't1',
    title: { en: 'Finish homepage wireframes for client review', zh: '完成客户评审用的首页线框' },
    desc: { en: 'Hero, features section, footer. Polish enough for Friday\'s review.', zh: 'Hero、功能区、Footer。打磨到周五评审可看的程度。' },
    quadrant: 'Q1', today: true, due: 'today', duration: 90,
    pomos_done: 1, pomos_total: 4,
    reason: { en: 'Due today and blocks the next design stage.', zh: '今天截止，会卡住下一阶段。' },
    conviction: 0.92,
    next_step: { en: 'Open Hero frame · Outline 3 layout options', zh: '打开 Hero 画板 · 列 3 个版式' },
    not_now: [
      { id: 't2', reason: { en: 'Can wait until Sat — no blocker', zh: '周六前都不卡进度' } },
      { id: 't4', reason: { en: 'Needs Maya\'s input first', zh: '得先等 Maya 反馈' } },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    title: { en: 'Draft Q3 OKRs', zh: '起草 Q3 OKR 初稿' },
    desc: { en: 'Three objectives, five KRs each.', zh: '三个目标，每个 5 个关键结果。' },
    quadrant: 'Q2', today: true, due: 'Fri', duration: 60,
    pomos_done: 0, pomos_total: 3, createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: { en: 'Reply to investor follow-up email', zh: '回复投资人跟进邮件' },
    quadrant: 'Q1', today: true, due: 'today', duration: 20,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
  {
    id: 't4',
    title: { en: 'Refactor auth module — token rotation', zh: '重构 auth 模块的 Token 轮换' },
    quadrant: 'Q2', today: false, due: 'next wk', duration: 180,
    pomos_done: 0, pomos_total: 6, ai_suggest: 'Q2', createdAt: new Date().toISOString(),
  },
  {
    id: 't5',
    title: { en: 'Approve Acme invoices', zh: '审批 Acme 发票' },
    quadrant: 'Q3', today: true, due: 'today', duration: 15,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
  {
    id: 't6',
    title: { en: 'Clean up Downloads folder', zh: '清理下载文件夹' },
    quadrant: 'Q4', today: false, due: null, duration: 15,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
  {
    id: 't7',
    title: { en: 'Plan team offsite agenda', zh: '策划团队 offsite 议程' },
    quadrant: 'unclassified', today: false, due: 'Aug 2', duration: 45,
    pomos_done: 0, pomos_total: 2, ai_suggest: 'Q2', createdAt: new Date().toISOString(),
  },
  {
    id: 't8',
    title: { en: 'Read research on focus rhythms', zh: '读专注节奏相关的研究' },
    quadrant: 'unclassified', today: false, due: null, duration: 40,
    pomos_done: 0, pomos_total: 2, ai_suggest: 'Q4', createdAt: new Date().toISOString(),
  },
  {
    id: 't9',
    title: { en: 'Renew domain — lumo.app', zh: '续费域名 — lumo.app' },
    quadrant: 'Q3', today: false, due: 'Aug 14', duration: 5,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
  {
    id: 't10',
    title: { en: 'Read Pieter\'s design crit notes', zh: '阅读 Pieter 的设计批注' },
    quadrant: 'Q2', today: false, due: null, duration: 25,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
  {
    id: 't11',
    title: { en: 'Reorder office supplies', zh: '补购办公用品' },
    quadrant: 'Q4', today: false, due: null, duration: 10,
    pomos_done: 0, pomos_total: 1, createdAt: new Date().toISOString(),
  },
]

const SEED_COMPLETED: CompletedTask[] = [
  { id: 'c1', title: { en: 'Reply to design feedback from Pieter', zh: '回复 Pieter 的设计反馈' }, duration: 18 },
  { id: 'c2', title: { en: 'Set up next week\'s calendar blocks', zh: '排好下周的日程块' }, duration: 12 },
]

const DEFAULT_SETTINGS: AppSettings = {
  accent: 'green',
  lang: 'en',
  density: 'comfortable',
  reducedMotion: false,
  cloudSync: false,
  syncTasks: true,
  syncMemory: true,
  syncConversations: false,
  aiProvider: 'claude',
  aiModel: 'claude-haiku-4-5',
  aiApiKey: '',
  aiBaseUrl: '',
  pomoDuration: 25,
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '09:00',
}

export const DEFAULT_USER: UserProfile = {
  id: 'local',
  name: 'Local User',
  email: 'user@lumotask.app',
  plan: 'free',
}

// ── Storage keys ──────────────────────────────────────────────────────
const KEY_TASKS = 'lumo:tasks'
const KEY_COMPLETED = 'lumo:completed'
const KEY_SETTINGS = 'lumo:settings'
const KEY_USER = 'lumo:user'
const KEY_AUTH = 'lumo:auth'

// ── In-memory store ───────────────────────────────────────────────────
interface DB {
  tasks: Task[]
  completed: CompletedTask[]
  settings: AppSettings
  user: UserProfile | null
  isAuthenticated: boolean
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// Initialize from localStorage (or seed data)
export const db: DB = {
  tasks: load(KEY_TASKS, SEED_TASKS),
  completed: load(KEY_COMPLETED, SEED_COMPLETED),
  settings: { ...DEFAULT_SETTINGS, ...load<Partial<AppSettings>>(KEY_SETTINGS, {}) },
  user: load<UserProfile | null>(KEY_USER, null),
  isAuthenticated: load<boolean>(KEY_AUTH, false),
}

// ── Persistence helpers ───────────────────────────────────────────────
export function persistTasks() { save(KEY_TASKS, db.tasks) }
export function persistCompleted() { save(KEY_COMPLETED, db.completed) }
export function persistSettings() { save(KEY_SETTINGS, db.settings) }
export function persistUser() { save(KEY_USER, db.user); save(KEY_AUTH, db.isAuthenticated) }

// ── ID generator ──────────────────────────────────────────────────────
let idCounter = 100
export function nextId(prefix = 't') { return `${prefix}${++idCounter}` }

// Export seed for mock AI to reference
export { SEED_TASKS, DEFAULT_SETTINGS }
