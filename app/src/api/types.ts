// All API request/response types

export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'unclassified'
export type Lang = 'en' | 'zh'
export type AccentKey = 'green' | 'cyan' | 'amber' | 'graphite'
export type DensityKey = 'comfortable' | 'compact'
export type AiProvider = 'openai' | 'claude' | 'gemini' | 'deepseek' | 'ollama' | 'custom'

export interface BilingualText {
  en: string
  zh: string
}

export interface Task {
  id: string
  title: BilingualText
  desc?: BilingualText
  quadrant: Quadrant
  today: boolean
  due?: string | null
  duration?: number        // minutes
  pomos_done: number
  pomos_total: number
  reason?: BilingualText
  conviction?: number      // 0-1
  next_step?: BilingualText
  not_now?: Array<{ id: string; reason: BilingualText }>
  ai_suggest?: Quadrant
  completed?: boolean
  completedAt?: string
  createdAt?: string
}

export interface CompletedTask {
  id: string
  title: BilingualText
  duration?: number
  completedAt?: string
}

export interface CreateTaskDto {
  title: BilingualText
  desc?: BilingualText
  quadrant: Quadrant
  today?: boolean
  due?: string | null
  duration?: number
  pomos_total?: number
}

export interface ParsedTask {
  title: BilingualText
  quadrant: Quadrant
  quadrant_reason: BilingualText
  due?: string | null
  duration?: number
  pomos_total?: number
}

export interface AiRecommendation {
  task: Task
  conviction: number
  reason: BilingualText
  next_step: BilingualText
  not_now: Array<{ id: string; reason: BilingualText }>
}

export interface AiClassifyResult {
  classifications: Array<{ id: string; quadrant: Quadrant; reason: BilingualText }>
}

export interface FocusSession {
  id: string
  taskId: string
  startedAt: string
  completedAt?: string
  durationSeconds: number
  round: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro'
  avatar?: string
  renewsAt?: string
}

export interface AppSettings {
  accent: AccentKey
  lang: Lang
  density: DensityKey
  reducedMotion: boolean
  cloudSync: boolean
  syncTasks: boolean
  syncMemory: boolean
  syncConversations: boolean
  aiProvider: AiProvider
  aiModel: string
  aiApiKey: string
  aiBaseUrl?: string
  pomoDuration: number    // minutes
  quietHoursEnabled: boolean
  quietStart: string      // "22:00"
  quietEnd: string        // "09:00"
}

export interface AuthResponse {
  user: UserProfile
  token: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}
