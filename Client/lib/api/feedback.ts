import { apiClient } from './client'
import type { FeedbackResponse, FeedbackStatus } from './portal'

export type FeedbackUpdateRequest = {
  feedbackStatus?: FeedbackStatus
  adminResponse?: string
}

export const getAllFeedback = () => apiClient<FeedbackResponse[]>('/feedback/all')

export const updateFeedback = (feedbackId: number, payload: FeedbackUpdateRequest) =>
  apiClient<FeedbackResponse>(`/feedback/${feedbackId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export type { FeedbackResponse, FeedbackStatus }
