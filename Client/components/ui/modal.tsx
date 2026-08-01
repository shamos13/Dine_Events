'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
  /** When true, Escape / close button do nothing (e.g. while awaiting M-Pesa). */
  closeDisabled?: boolean
}

export function Modal({ isOpen, onClose, title, children, size = 'md', closeDisabled = false }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    // Prefer form fields so Space/typing works; avoid autofocusing the header Close button.
    const field = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea')
    if (field) {
      field.focus()
    } else {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable
        ? Array.from(focusable).find((el) => el.getAttribute('aria-label') !== 'Close')
        : undefined
      first?.focus()
    }

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose, closeDisabled])

  if (!isOpen) return null

  const widthClass = size === 'xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-xl' : 'max-w-md'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full ${widthClass} rounded-2xl border border-gray-200 bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
