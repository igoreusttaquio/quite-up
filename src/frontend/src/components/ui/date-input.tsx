import { forwardRef, useRef, useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { InputProps } from './input'

function toDisplay(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function toISO(display: string): string | null {
  const parts = display.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (d.length !== 2 || m.length !== 2 || y.length !== 4) return null
  const date = new Date(`${y}-${m}-${d}T00:00:00`)
  if (isNaN(date.getTime())) return null
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export const DateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, value, onChange, onBlur, disabled, id, name }, ref) => {
    const isoValue = (value as string) ?? ''
    const [display, setDisplay] = useState(() => toDisplay(isoValue))
    const hiddenRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setDisplay(toDisplay(isoValue))
    }, [isoValue])

    const fireChange = (iso: string) => {
      onChange?.({
        target: { value: iso, name: name ?? '' },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value)
      setDisplay(masked)
      if (masked === '') {
        fireChange('')
        return
      }
      const iso = toISO(masked)
      if (iso) fireChange(iso)
    }

    const handleHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const iso = e.target.value
      setDisplay(toDisplay(iso))
      fireChange(iso)
    }

    return (
      <div className={cn('relative', className)}>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          value={display}
          onChange={handleTextChange}
          onBlur={onBlur}
          disabled={disabled}
          id={id}
          name={name}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background',
            'px-3 py-2 pr-9 text-sm',
            'ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => hiddenRef.current?.showPicker?.()}
          tabIndex={-1}
          aria-label="Abrir calendário"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
        >
          <Calendar size={15} />
        </button>
        {/* Hidden native date input — only used for the browser picker */}
        <input
          ref={hiddenRef}
          type="date"
          lang="pt-BR"
          value={isoValue}
          onChange={handleHiddenChange}
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          className="sr-only"
        />
      </div>
    )
  }
)
DateInput.displayName = 'DateInput'
