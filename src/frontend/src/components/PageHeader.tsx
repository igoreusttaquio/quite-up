import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { useRegisterPrimaryAction } from '../context/PrimaryActionContext'
import { cn } from '../lib/utils'

export interface PageHeaderAction {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  /**
   * Ação principal (ex.: "Nova Dívida"). Desktop: botão à direita.
   * Celular: não aparece no cabeçalho — vira a ação do "+" central da barra inferior.
   */
  primaryAction?: Omit<PageHeaderAction, 'icon'> & { icon?: ReactNode }
  /** Ações secundárias. Desktop: botões contornados. Celular: botões de ícone (com aria-label). */
  secondaryActions?: PageHeaderAction[]
  className?: string
}

/**
 * Cabeçalho padrão das páginas. O título nunca quebra no meio da palavra
 * (nowrap + reticências como último recurso).
 */
export function PageHeader({ title, subtitle, primaryAction, secondaryActions = [], className }: PageHeaderProps) {
  useRegisterPrimaryAction(primaryAction)

  return (
    <div className={cn('mb-6 flex w-full min-w-0 items-center gap-3 md:items-start md:gap-4', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="truncate whitespace-nowrap text-2xl font-semibold tracking-tight md:text-3xl" title={title}>
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Celular: só ações secundárias, compactas */}
      {secondaryActions.length > 0 && (
        <div className="flex flex-shrink-0 items-center gap-1 md:hidden">
          {secondaryActions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="icon"
              onClick={a.onClick}
              disabled={a.disabled}
              aria-label={a.label}
              title={a.label}
            >
              {a.icon}
            </Button>
          ))}
        </div>
      )}

      {/* Desktop: secundárias + principal */}
      {(secondaryActions.length > 0 || primaryAction) && (
        <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
          {secondaryActions.map((a) => (
            <Button key={a.label} variant="outline" onClick={a.onClick} disabled={a.disabled} icon={a.icon}>
              {a.label}
            </Button>
          ))}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              icon={primaryAction.icon ?? <Plus size={16} />}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
