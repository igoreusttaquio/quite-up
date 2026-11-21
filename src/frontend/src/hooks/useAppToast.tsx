import { toast } from 'sonner'

export interface ToastAction {
  label: string
  onClick: () => void
}

/**
 * Sucesso/info somem rápido e sem botão de fechar; erro fica mais tempo e pode ser fechado.
 */
export function useAppToast() {
  return {
    success: (title: string, description?: string, action?: ToastAction, duration?: number) =>
      toast.success(title, { description, action, duration: duration ?? (action ? 4000 : 2500) }),
    error: (title: string, description?: string) =>
      toast.error(title, { description, duration: 6000, closeButton: true }),
    info: (title: string, description?: string, action?: ToastAction) =>
      toast.info(title, { description, action, duration: 3500 }),
    warning: (title: string, description?: string) =>
      toast.warning(title, { description, duration: 5000, closeButton: true }),
  }
}
