import { toast } from 'sonner'

export function useAppToast() {
  return {
    success: (title: string, body?: string) => toast.success(title, { description: body }),
    error:   (title: string, body?: string) => toast.error(title, { description: body }),
    info:    (title: string, body?: string) => toast.info(title, { description: body }),
    warning: (title: string, body?: string) => toast.warning(title, { description: body }),
  }
}
