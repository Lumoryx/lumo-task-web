import { mock, USE_MOCK, apiCall } from './client'
import type { Task, CreateTaskDto, Quadrant } from './types'

export const tasksApi = {
  list: (): Promise<Task[]> =>
    USE_MOCK ? mock.tasks.list() : apiCall('/api/tasks'),

  today: (): Promise<Task[]> =>
    USE_MOCK ? mock.tasks.today() : apiCall('/api/tasks/today'),

  create: (dto: CreateTaskDto): Promise<Task> =>
    USE_MOCK ? mock.tasks.create(dto) : apiCall('/api/tasks', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, patch: Partial<Task>): Promise<Task> =>
    USE_MOCK ? mock.tasks.update(id, patch) : apiCall(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  complete: (id: string): Promise<Task> =>
    USE_MOCK ? mock.tasks.complete(id) : apiCall(`/api/tasks/${id}/complete`, { method: 'POST' }),

  delete: (id: string): Promise<void> =>
    USE_MOCK ? mock.tasks.delete(id) : apiCall(`/api/tasks/${id}`, { method: 'DELETE' }),

  moveQuadrant: (id: string, quadrant: Quadrant): Promise<Task> =>
    USE_MOCK ? mock.tasks.moveQuadrant(id, quadrant) : apiCall(`/api/tasks/${id}/quadrant`, { method: 'PUT', body: JSON.stringify({ quadrant }) }),

  toggleToday: (id: string, today: boolean): Promise<Task> =>
    USE_MOCK ? mock.tasks.toggleToday(id, today) : apiCall(`/api/tasks/${id}/today`, { method: 'PUT', body: JSON.stringify({ today }) }),
}
