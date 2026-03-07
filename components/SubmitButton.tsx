'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function SubmitButton({ 
  children, 
  className,
  loadingText = "Procesando..."
}: { 
  children: React.ReactNode, 
  className?: string,
  loadingText?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={`flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${className}`}
    >
      {pending ? (
        <><Loader2 size={16} className="animate-spin" /> {loadingText}</>
      ) : (
        children
      )}
    </button>
  )
}