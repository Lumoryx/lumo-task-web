import { create } from 'zustand'
import { focusApi } from '../api/focus'

interface FocusState {
  isActive: boolean
  taskId: string | null
  remainingSeconds: number
  totalSeconds: number
  isPaused: boolean
  currentRound: number
  totalRounds: number
  elapsedSeconds: number
  showComplete: boolean

  startSession: (taskId: string, durationMinutes?: number, totalRounds?: number) => void
  pause: () => void
  resume: () => void
  tick: () => void
  completeRound: () => Promise<void>
  completeTask: () => void
  exitSession: () => void
  dismissComplete: () => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  taskId: null,
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  isPaused: false,
  currentRound: 1,
  totalRounds: 4,
  elapsedSeconds: 0,
  showComplete: false,

  startSession: (taskId, durationMinutes = 25, totalRounds = 4) => {
    const totalSeconds = durationMinutes * 60
    set({
      isActive: true, taskId,
      remainingSeconds: totalSeconds, totalSeconds,
      isPaused: false, currentRound: 1, totalRounds,
      elapsedSeconds: 0, showComplete: false,
    })
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  tick: () => {
    const { remainingSeconds, elapsedSeconds, isPaused } = get()
    if (isPaused) return
    if (remainingSeconds <= 0) {
      get().completeRound()
      return
    }
    set({ remainingSeconds: remainingSeconds - 1, elapsedSeconds: elapsedSeconds + 1 })
  },

  completeRound: async () => {
    const { taskId, currentRound, totalSeconds } = get()
    if (!taskId) return
    try {
      await focusApi.completeSession(taskId, totalSeconds, currentRound)
    } catch { /* ignore */ }
    set({ showComplete: true, isPaused: true })
  },

  completeTask: () => {
    set({ isActive: false, showComplete: false, taskId: null })
  },

  exitSession: () => {
    set({ isActive: false, showComplete: false, taskId: null, isPaused: false })
  },

  dismissComplete: () => {
    const { currentRound, totalRounds, totalSeconds } = get()
    if (currentRound < totalRounds) {
      set({
        currentRound: currentRound + 1,
        remainingSeconds: totalSeconds,
        elapsedSeconds: 0,
        isPaused: false,
        showComplete: false,
      })
    } else {
      set({ isActive: false, showComplete: false, taskId: null })
    }
  },
}))
