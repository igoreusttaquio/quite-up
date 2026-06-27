import { cn } from '../../lib/utils'

type SpinnerSize = 'tiny' | 'extra-small' | 'small' | 'medium' | 'large'

const sizeClasses: Record<SpinnerSize, string> = {
  tiny: 'h-3 w-3 border-[1.5px]',
  'extra-small': 'h-3 w-3 border-[1.5px]',
  small: 'h-4 w-4 border-2',
  medium: 'h-5 w-5 border-2',
  large: 'h-8 w-8 border-[3px]',
}

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
}

export function Spinner({ size = 'medium', className }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-current border-t-transparent animate-spin',
        sizeClasses[size],
        className
      )}
    />
  )
}
