import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-20 w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 outline-none resize-none',
        'bg-slate-800/80 border border-slate-600 text-slate-100',
        'placeholder:text-slate-500',
        'hover:border-slate-500',
        'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
