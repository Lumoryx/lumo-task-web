import { create } from 'zustand'
import { tasksApi } from '../api/tasks'
import type { Task, CreateTaskDto, Quadrant } from '../api/types'

interface TaskState {
  tasks: Task[]
  completed: { id: string; title: { en: string; zh: string }; duration?: number }[]
  loading: boolean
  fetchTasks: () => Promise<void>
  addTask: (dto: CreateTaskDto) => Promise<Task>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  completeTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveQuadrant: (id: string, quadrant: Quadrant) => Promise<void>
  toggleToday: (id: string, today: boolean) => Promise<void>
  incrementPomos: (id: string) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  completed: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true })
    try {
      const tasks = await tasksApi.list()
      set({ tasks, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addTask: async (dto) => {
    const task = await tasksApi.create(dto)
    set(s => ({ tasks: [task, ...s.tasks] }))
    return task
  },

  updateTask: async (id, patch) => {
    const updated = await tasksApi.update(id, patch)
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? updated : t) }))
  },

  completeTask: async (id) => {
    await tasksApi.complete(id)
    const task = get().tasks.find(t => t.id === id)
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, completed: true } : t),
      completed: task ? [{ id: task.id, title: task.title, duration: task.duration }, ...s.completed] : s.completed,
    }))
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id)
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
  },

  moveQuadrant: async (id, quadrant) => {
    const updated = await tasksApi.moveQuadrant(id, quadrant)
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? updated : t) }))
  },

  toggleToday: async (id, today) => {
    const updated = await tasksApi.toggleToday(id, today)
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? updated : t) }))
  },

  incrementPomos: (id) => {
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === id ? { ...t, pomos_done: Math.min(t.pomos_done + 1, t.pomos_total) } : t
      )
    }))
  },
}))
