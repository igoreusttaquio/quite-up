import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        destructive: 'border-destructive/50 bg-destructive/5 text-destructive',
        error: 'border-destructive/50 bg-destructive/5 text-destructive',
        warning: 'border-yellow-500/50 bg-yellow-50/50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
        success: 'border-green-500/50 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400',
        info: 'border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

type AlertIntent = 'error' | 'warning' | 'success' | 'info'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  intent?: AlertIntent
}

function Alert({ className, variant, intent, ...props }: AlertProps) {
  const resolvedVariant = variant ?? (intent as VariantProps<typeof alertVariants>['variant']) ?? 'default'
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  )
}
Alert.displayName = 'Alert'

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}
AlertTitle.displayName = 'AlertTitle'

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('[&_p]:leading-relaxed', className)} {...props} />
}
AlertDescription.displayName = 'AlertDescription'

const MessageBar = Alert
const MessageBarBody = AlertDescription

export { Alert, AlertTitle, AlertDescription, MessageBar, MessageBarBody }
