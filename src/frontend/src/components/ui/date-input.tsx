import { forwardRef, useRef } from 'react'
import { cn } from '../../lib/utils'
import type { InputProps } from './input'

export const DateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      innerRef.current?.showPicker?.()
      onClick?.(e)
    }

    return (
      <input
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="date"
        lang="pt-BR"
        onClick={handleClick}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background cursor-pointer',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)
DateInput.displayName = 'DateInput'
