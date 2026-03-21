'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function SubmitButton({
  children,
  className,
  loadingText = "Procesando...",
  iconOnly = false,
  title,
}: {
  children: React.ReactNode
  className?: string
  loadingText?: string
  iconOnly?: boolean
  title?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={`flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${className}`}
    >
      {pending ? (
        iconOnly
          ? <Loader2 size={18} className="animate-spin" />
          : <><Loader2 size={16} className="animate-spin" /> {loadingText}</>
      ) : (
        children
      )}
    </button>
  )
}
