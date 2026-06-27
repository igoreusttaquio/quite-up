import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        income: 'border-transparent bg-income/15 text-income',
        expense: 'border-transparent bg-expense/15 text-expense',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  appearance?: 'outline' | 'filled' | 'tint'
  size?: 'small' | 'extra-small' | 'medium'
}

function Badge({ className, variant, appearance, size: _size, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? (appearance === 'outline' ? 'outline' : 'default')
  return (
    <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
