import { useToastController, Toast, ToastTitle, ToastBody } from '@fluentui/react-components'

export const TOASTER_ID = 'app-toaster'

export function useAppToast() {
  const { dispatchToast } = useToastController(TOASTER_ID)

  const show = (title: string, body: string | undefined, intent: 'success' | 'error' | 'info' | 'warning', timeout: number) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, timeout }
    )

  return {
    success: (title: string, body?: string) => show(title, body, 'success', 4000),
    error:   (title: string, body?: string) => show(title, body, 'error',   6000),
    info:    (title: string, body?: string) => show(title, body, 'info',    4000),
    warning: (title: string, body?: string) => show(title, body, 'warning', 5000),
  }
}
