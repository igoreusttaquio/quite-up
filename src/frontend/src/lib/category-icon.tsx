import {
  Baby, Banknote, BarChart3, BookOpen, Briefcase, Bus, Car, Clapperboard, Coffee, CreditCard,
  Dog, Dumbbell, Fuel, Gamepad2, Gift, Globe, GraduationCap, Guitar, HeartPulse, Home,
  Hospital, KeyRound, Landmark, Laptop, Lightbulb, MinusCircle, Music, Palette, PawPrint, PiggyBank,
  Pill, Pizza, Plane, PlusCircle, Receipt, Repeat, Scissors, Shirt, ShoppingCart, ShowerHead,
  Smartphone, Sparkles, Sprout, Tag, Target, Ticket, TrendingUp, Tv, Utensils, Wallet,
  Wifi, Wrench, Zap, Beer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Ícones disponíveis para categorias (o valor salvo é a chave). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'wallet': Wallet,
  'banknote': Banknote,
  'piggy-bank': PiggyBank,
  'landmark': Landmark,
  'credit-card': CreditCard,
  'receipt': Receipt,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'bar-chart-3': BarChart3,
  'gift': Gift,
  'home': Home,
  'lightbulb': Lightbulb,
  'zap': Zap,
  'wifi': Wifi,
  'shower-head': ShowerHead,
  'wrench': Wrench,
  'key-round': KeyRound,
  'utensils': Utensils,
  'pizza': Pizza,
  'coffee': Coffee,
  'beer': Beer,
  'shopping-cart': ShoppingCart,
  'shirt': Shirt,
  'car': Car,
  'fuel': Fuel,
  'bus': Bus,
  'plane': Plane,
  'globe': Globe,
  'heart-pulse': HeartPulse,
  'hospital': Hospital,
  'pill': Pill,
  'dumbbell': Dumbbell,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'baby': Baby,
  'paw-print': PawPrint,
  'dog': Dog,
  'gamepad-2': Gamepad2,
  'tv': Tv,
  'clapperboard': Clapperboard,
  'ticket': Ticket,
  'music': Music,
  'guitar': Guitar,
  'palette': Palette,
  'scissors': Scissors,
  'sparkles': Sparkles,
  'smartphone': Smartphone,
  'sprout': Sprout,
  'target': Target,
  'repeat': Repeat,
  'plus-circle': PlusCircle,
  'minus-circle': MinusCircle,
  'tag': Tag,
}

/** Emojis usados antes (categorias já salvas) → ícone lucide equivalente. */
const EMOJI_TO_ICON: Record<string, string> = {
  '💰': 'banknote', '💳': 'credit-card', '🏠': 'home', '🚗': 'car', '🍔': 'utensils',
  '✈️': 'plane', '✈': 'plane', '📚': 'book-open', '🏥': 'hospital', '🎮': 'gamepad-2',
  '🛒': 'shopping-cart', '💼': 'briefcase', '📱': 'smartphone', '🎵': 'music', '🏋️': 'dumbbell',
  '🏋': 'dumbbell', '🐾': 'paw-print', '🎁': 'gift', '🔧': 'wrench', '⚡': 'zap',
  '🌱': 'sprout', '🏦': 'landmark', '🎯': 'target', '🍕': 'pizza', '👕': 'shirt',
  '🚿': 'shower-head', '💡': 'lightbulb', '🌍': 'globe', '📊': 'bar-chart-3', '🎓': 'graduation-cap',
  '🎬': 'clapperboard', '🍺': 'beer', '☕': 'coffee', '💊': 'pill', '🚌': 'bus',
  '🔑': 'key-round', '🎸': 'guitar', '🎨': 'palette', '🧴': 'sparkles', '🎪': 'ticket',
  '💅': 'scissors', '🐕': 'dog', '💻': 'laptop', '📈': 'trending-up', '➕': 'plus-circle',
  '🍴': 'utensils', '❤️': 'heart-pulse', '❤': 'heart-pulse', '🔁': 'repeat', '➖': 'minus-circle',
}

/** Normaliza o valor salvo (nome de ícone ou emoji antigo) para uma chave de CATEGORY_ICONS. */
export function resolveCategoryIconKey(icon: string | undefined | null): string {
  if (!icon) return 'tag'
  if (CATEGORY_ICONS[icon]) return icon
  return EMOJI_TO_ICON[icon] ?? EMOJI_TO_ICON[icon.replace(/️/g, '')] ?? 'tag'
}

/** Renderiza o ícone lucide da categoria (emojis antigos são convertidos). */
export function CategoryIcon({ icon, size = 20, color }: { icon: string; size?: number; color?: string }) {
  const Icon = CATEGORY_ICONS[resolveCategoryIconKey(icon)]
  return <Icon size={size} color={color} />
}
