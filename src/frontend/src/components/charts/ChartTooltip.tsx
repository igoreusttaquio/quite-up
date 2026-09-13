const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface TooltipEntry {
  dataKey?: string | number
  name?: string | number
  value?: number | string
  color?: string
  payload?: { fill?: string }
}

interface CurrencyTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
}

export function CurrencyTooltip({ active, payload, label }: CurrencyTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-popover-foreground">{label}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
              />
              {entry.name}
            </span>
            <span className="font-medium text-popover-foreground">
              {brl.format(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
