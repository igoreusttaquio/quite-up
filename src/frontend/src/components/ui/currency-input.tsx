import { cn } from '../../lib/utils'

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  disabled?: boolean
  id?: string
}

export function CurrencyInput({ value, onChange, className, disabled, id }: CurrencyInputProps) {
  const cents = Math.round((value ?? 0) * 100)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      onChange(Math.min(cents * 10 + parseInt(e.key), 99999999) / 100)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      onChange(Math.floor(cents / 10) / 100)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      onChange(0)
    } else if (!['Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'F5'].includes(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={fmt.format(cents / 100)}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm',
          'ring-offset-background caret-transparent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
    </div>
  )
}
