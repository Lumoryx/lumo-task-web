import { mock, USE_MOCK, apiCall } from './client'
import type { FocusSession } from './types'

export const focusApi = {
  completeSession: (taskId: string, durationSeconds: number, round: number): Promise<FocusSession> =>
    USE_MOCK
      ? mock.focus.completeSession(taskId, durationSeconds, round)
      : apiCall('/api/focus/sessions', { method: 'POST', body: JSON.stringify({ taskId, durationSeconds, round }) }),
}
