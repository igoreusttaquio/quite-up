import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

type FluentAppearance = 'primary' | 'outline' | 'subtle' | 'ghost' | 'transparent' | 'secondary'
type FluentSize = 'small' | 'medium' | 'large'

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    Omit<VariantProps<typeof buttonVariants>, 'size'> {
  asChild?: boolean
  icon?: React.ReactNode
  appearance?: FluentAppearance
  size?: 'sm' | 'default' | 'lg' | 'icon' | 'icon-sm' | FluentSize
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, appearance, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    const resolvedVariant: VariantProps<typeof buttonVariants>['variant'] =
      variant ??
      (appearance === 'primary' ? 'default'
        : appearance === 'outline' ? 'outline'
        : appearance === 'subtle' || appearance === 'ghost' || appearance === 'transparent' ? 'ghost'
        : appearance === 'secondary' ? 'secondary'
        : 'default')

    const resolvedSize: VariantProps<typeof buttonVariants>['size'] =
      size === 'small' ? 'sm'
      : size === 'large' ? 'lg'
      : size === 'medium' ? 'default'
      : (size as VariantProps<typeof buttonVariants>['size']) ?? 'default'

    return (
      <Comp
        className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
        ref={ref}
        {...props}
      >
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
