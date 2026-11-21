import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, FoldVertical, LogOut, Moon, Sun, UnfoldVertical, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { usePreferences } from '../../context/PreferencesContext'
import { UserAvatar } from '../UserAvatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import { cn } from '../../lib/utils'

export interface SidebarNavItem {
  label: string
  path: string
  Icon: LucideIcon
}

/*
 * Geometria em px (não em rem) para não variar com a densidade e para os ícones
 * não se moverem ao recolher: tudo fica centralizado no eixo x = 36px.
 *   recolhida: 72px de largura → centro em 36px
 *   item: nav com 16px de padding + item com 10px → ícone de 20px começa em 26px (centro 36px)
 *   logo: 32px a partir de 20px (centro 36px) · avatar: 30px a partir de 21px · botões: 36px a partir de 18px
 */
export const SIDEBAR_WIDTH_EXPANDED = 'md:ml-[240px]'
export const SIDEBAR_WIDTH_COLLAPSED = 'md:ml-[72px]'

function NavItem({ item, collapsed }: { item: SidebarNavItem; collapsed: boolean }) {
  const { label, path, Icon } = item
  // Classe calculada aqui (string), e não pela função do NavLink: o TooltipTrigger (asChild)
  // mescla className como texto e quebraria a função.
  const isActive = !!useMatch({ path, end: false })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={path}
          aria-label={collapsed ? label : undefined}
          className={cn(
            'flex h-[40px] items-center gap-[12px] overflow-hidden rounded-lg px-[10px] text-sm font-medium no-underline transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Icon size={20} className="flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-opacity duration-200',
              collapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            )}
          >
            {label}
          </span>
        </NavLink>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}

function FooterButton({
  label,
  onClick,
  disabled,
  danger,
  collapsed,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  collapsed: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 cursor-pointer',
            danger ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side={collapsed ? 'right' : 'top'}>{label}</TooltipContent>
    </Tooltip>
  )
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function DesktopSidebar({ items }: { items: SidebarNavItem[] }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { mode, toggle: toggleTheme } = useTheme()
  const { density, toggleDensity, sidebarCollapsed: collapsed, toggleSidebar } = usePreferences()

  // Atalho Ctrl+B (ou Cmd+B) para recolher/expandir, fora de campos de texto.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !isTypingTarget(e.target)) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  const toggleLabel = collapsed ? 'Expandir menu' : 'Recolher menu'
  const fade = cn('transition-opacity duration-200', collapsed ? 'pointer-events-none opacity-0' : 'opacity-100')

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 z-20 h-screen border-r border-border bg-card',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-[56px] flex-shrink-0 items-center overflow-hidden border-b border-border pl-[20px]">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-[10px]" aria-label="Quite-Up — início">
          <img src="/favicon.svg" alt="" className="h-[32px] w-[32px] flex-shrink-0" />
          <div className={cn('min-w-0 whitespace-nowrap', fade)}>
            <span className="block font-bold leading-none tracking-tight text-primary">Quite-Up</span>
            <span className="mt-0.5 block text-[10px] leading-none text-muted-foreground">Finanças pessoais</span>
          </div>
        </Link>
      </div>

      {/* Recolher/expandir: preso na borda direita, na altura do header */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className={cn(
              'absolute -right-[12px] top-[28px] z-30 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center',
              'rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors cursor-pointer',
              'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {toggleLabel} <span className="ml-1 opacity-60">Ctrl+B</span>
        </TooltipContent>
      </Tooltip>

      {/* Navegação */}
      <nav className="flex-1 space-y-[4px] overflow-y-auto overflow-x-hidden px-[16px] py-[12px]">
        {items.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Rodapé */}
      <div className="flex-shrink-0 space-y-[4px] overflow-hidden border-t border-border px-[16px] py-[12px]">
        <div className="flex items-center gap-[10px] py-[4px] pl-[5px]">
          <UserAvatar name={user?.name} size={30} />
          <div className={cn('min-w-0 flex-1', fade)}>
            <p className="truncate text-sm font-semibold leading-none">{user?.name}</p>
            <p className="mt-0.5 truncate text-xs text-subtle">{user?.email}</p>
          </div>
        </div>
        <div className={cn('flex gap-[4px] pl-[2px]', collapsed ? 'flex-col' : 'flex-row')}>
          <FooterButton
            label={mode === 'light' ? 'Tema escuro' : 'Tema claro'}
            onClick={toggleTheme}
            collapsed={collapsed}
          >
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </FooterButton>
          <FooterButton
            label={density === 'compact' ? 'Modo confortável' : 'Modo compacto'}
            onClick={toggleDensity}
            collapsed={collapsed}
          >
            {density === 'compact' ? <UnfoldVertical size={18} /> : <FoldVertical size={18} />}
          </FooterButton>
          <FooterButton
            label="Sair"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            danger
            collapsed={collapsed}
          >
            <LogOut size={18} />
          </FooterButton>
        </div>
      </div>
    </aside>
  )
}
