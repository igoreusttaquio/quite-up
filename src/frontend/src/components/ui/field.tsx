import type { ReactNode } from 'react'
import { Label } from './label'
import { cn } from '../../lib/utils'

interface FieldProps {
  label?: string
  required?: boolean
  validationState?: 'error' | 'success' | 'warning' | 'none'
  validationMessage?: string
  children: ReactNode
  className?: string
}

export function Field({ label, required, validationState, validationMessage, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
      )}
      {children}
      {validationState === 'error' && validationMessage && (
        <p className="text-xs text-destructive">{validationMessage}</p>
      )}
    </div>
  )
}
