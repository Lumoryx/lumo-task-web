import { mock, USE_MOCK, apiCall } from './client'
import type { AiRecommendation, AiClassifyResult, ParsedTask, Lang } from './types'

export const aiApi = {
  recommend: (): Promise<AiRecommendation> =>
    USE_MOCK ? mock.ai.recommend() : apiCall('/api/ai/recommend', { method: 'POST' }),

  classify: (taskIds?: string[]): Promise<AiClassifyResult> =>
    USE_MOCK ? mock.ai.classify(taskIds) : apiCall('/api/ai/classify', { method: 'POST', body: JSON.stringify({ taskIds }) }),

  parseText: (text: string, lang: Lang): Promise<ParsedTask> =>
    USE_MOCK ? mock.ai.parseText(text, lang) : apiCall('/api/tasks/parse', { method: 'POST', body: JSON.stringify({ text, lang }) }),
}
