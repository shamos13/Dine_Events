import { apiClient } from './client'

export type MediaUploadResponse = {
  url: string
  publicId: string | null
}

export const uploadMedia = (file: File, folder = 'general') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  return apiClient<MediaUploadResponse>('/media/upload', {
    method: 'POST',
    body: formData,
  })
}
