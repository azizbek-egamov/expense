import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full rounded-lg px-4 py-2 text-sm transition-all duration-200 outline-none',
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

export { Input }
