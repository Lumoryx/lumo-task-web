import { db, nextId, persistTasks } from './db'
import { mockDelay } from './delay'
import type { FocusSession } from '../types'

export const focusMock = {
  async completeSession(taskId: string, durationSeconds: number, round: number): Promise<FocusSession> {
    await mockDelay(60, 120)
    const session: FocusSession = {
      id: nextId('s'),
      taskId,
      startedAt: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds,
      round,
    }

    // Increment pomos_done on the task
    const task = db.tasks.find(t => t.id === taskId)
    if (task) {
      task.pomos_done = Math.min(task.pomos_done + 1, task.pomos_total)
      persistTasks()
    }

    return session
  },
}
