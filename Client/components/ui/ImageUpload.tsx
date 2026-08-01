'use client'

import Image from 'next/image'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { uploadMedia } from '@/lib/api/media'

type ImageUploadProps = {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  label?: string
  helperText?: string
  shape?: 'square' | 'circle'
  className?: string
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'general',
  label = 'Image',
  helperText = 'JPEG, PNG, WEBP, or GIF up to 5MB.',
  shape = 'square',
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const revokePreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    setLocalPreview(null)
  }

  useEffect(
    () => () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }
    },
    []
  )

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    revokePreview()

    const previewUrl = URL.createObjectURL(file)
    previewRef.current = previewUrl
    setLocalPreview(previewUrl)

    try {
      const result = await uploadMedia(file, folder)
      onChange(result.url)
      revokePreview()
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to upload image.')
      revokePreview()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const displaySrc = localPreview || value || null
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#8B4513]">{label}</p>
      <div className="flex items-start gap-4">
        <div
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-[#efb6b0] bg-[#edf4ff] ${radiusClass}`}
        >
          {displaySrc ? (
            localPreview ? (
              // Local blob preview before Cloudinary confirms the upload.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={localPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image src={displaySrc} alt="" fill sizes="96px" className="object-cover" unoptimized />
            )
          ) : (
            <ImagePlus className="h-8 w-8 text-[#cc2622]/70" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-[#cc2622]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-[#efb6b0] bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-[#cc2622] hover:text-[#cc2622] disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" />
              {value || localPreview ? 'Replace image' : 'Upload image'}
            </button>
            {(value || localPreview) && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  revokePreview()
                  onChange(null)
                }}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">{helperText}</p>
          {uploading && <p className="text-xs font-medium text-[#cc2622]">Uploading — preview shown above</p>}
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  )
}
