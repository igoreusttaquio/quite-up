import { forwardRef, useRef, useState, useEffect, useCallback } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { InputProps } from './input'

function toDisplay(value: string): string {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

export const DateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, value = '', onChange, onClick, ...props }, ref) => {
    const nativeRef = useRef<HTMLInputElement>(null)
    const [display, setDisplay] = useState(toDisplay(value as string))

    useEffect(() => {
      setDisplay(toDisplay(value as string))
    }, [value])

    const handleNativeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplay(toDisplay(e.target.value))
        onChange?.(e)
      },
      [onChange]
    )

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        nativeRef.current?.showPicker()
        nativeRef.current?.focus()
        onClick?.(e as unknown as React.MouseEvent<HTMLInputElement>)
      },
      [onClick]
    )

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            nativeRef.current?.showPicker()
          }
        }}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer',
          'ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !display && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex-1">{display || 'dd/mm/aaaa'}</span>
        <CalendarDays size={14} className="text-muted-foreground flex-shrink-0" />
        <input
          ref={(node) => {
            nativeRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          type="date"
          value={value as string}
          onChange={handleNativeChange}
          className="sr-only"
          tabIndex={-1}
          lang="pt-BR"
          aria-hidden="true"
          {...props}
        />
      </div>
    )
  }
)
DateInput.displayName = 'DateInput'
