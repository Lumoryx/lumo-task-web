import { db, nextId, persistTasks, persistCompleted } from './db'
import { mockDelay } from './delay'
import type { Task, CreateTaskDto, Quadrant } from '../types'

export const tasksMock = {
  async list(): Promise<Task[]> {
    await mockDelay(50, 120)
    return [...db.tasks]
  },

  async today(): Promise<Task[]> {
    await mockDelay(50, 100)
    return db.tasks.filter(t => t.today && !t.completed)
  },

  async create(dto: CreateTaskDto): Promise<Task> {
    await mockDelay(80, 150)
    const task: Task = {
      id: nextId(),
      title: dto.title,
      desc: dto.desc,
      quadrant: dto.quadrant,
      today: dto.today ?? false,
      due: dto.due ?? null,
      duration: dto.duration ?? 25,
      pomos_done: 0,
      pomos_total: dto.pomos_total ?? Math.ceil((dto.duration ?? 25) / 25),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    db.tasks.unshift(task)
    persistTasks()
    return task
  },

  async update(id: string, patch: Partial<Task>): Promise<Task> {
    await mockDelay(60, 120)
    const idx = db.tasks.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Task ${id} not found`)
    db.tasks[idx] = { ...db.tasks[idx], ...patch }
    persistTasks()
    return db.tasks[idx]
  },

  async complete(id: string): Promise<Task> {
    await mockDelay(60, 100)
    const idx = db.tasks.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Task ${id} not found`)
    const task = db.tasks[idx]
    task.completed = true
    task.completedAt = new Date().toISOString()
    // Move to completed list
    db.completed.unshift({ id: task.id, title: task.title, duration: task.duration, completedAt: task.completedAt })
    persistTasks()
    persistCompleted()
    return task
  },

  async delete(id: string): Promise<void> {
    await mockDelay(50, 100)
    db.tasks = db.tasks.filter(t => t.id !== id)
    persistTasks()
  },

  async moveQuadrant(id: string, quadrant: Quadrant): Promise<Task> {
    return tasksMock.update(id, { quadrant })
  },

  async toggleToday(id: string, today: boolean): Promise<Task> {
    return tasksMock.update(id, { today })
  },
}
