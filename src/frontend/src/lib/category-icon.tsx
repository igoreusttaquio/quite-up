import {
  Briefcase, Laptop, TrendingUp, Gift, PlusCircle,
  Utensils, Home, Car, HeartPulse, GraduationCap,
  Gamepad2, Shirt, Repeat, CreditCard, MinusCircle,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { FC } from 'react'

const LUCIDE_MAP: Record<string, FC<LucideProps>> = {
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'gift': Gift,
  'plus-circle': PlusCircle,
  'utensils': Utensils,
  'home': Home,
  'car': Car,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'shirt': Shirt,
  'repeat': Repeat,
  'credit-card': CreditCard,
  'minus-circle': MinusCircle,
}

/** Renders a Lucide icon (default categories) or an emoji string (user categories). */
export function CategoryIcon({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) {
  const LucideIcon = LUCIDE_MAP[icon]
  if (LucideIcon) {
    return <LucideIcon size={size} color={color} />
  }
  return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{icon}</span>
}

/** Returns an emoji string for use inside <option> or plain text contexts. */
export function resolveIconText(icon: string): string {
  const LUCIDE_EMOJI: Record<string, string> = {
    'briefcase': '💼',
    'laptop': '💻',
    'trending-up': '📈',
    'gift': '🎁',
    'plus-circle': '➕',
    'utensils': '🍴',
    'home': '🏠',
    'car': '🚗',
    'heart-pulse': '❤️',
    'graduation-cap': '🎓',
    'gamepad-2': '🎮',
    'shirt': '👕',
    'repeat': '🔁',
    'credit-card': '💳',
    'minus-circle': '➖',
  }
  return LUCIDE_EMOJI[icon] ?? icon
}
