import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mutationKeys } from '../lib/queryClient'
import { useAppToast } from './useAppToast'
import type { Attachment } from '../types'

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['transactions'] })
  queryClient.invalidateQueries({ queryKey: ['debts'] })
}

/** Envia comprovante. Offline, o arquivo fica salvo localmente e é enviado ao voltar a conexão. */
export function useUploadAttachment() {
  const queryClient = useQueryClient()
  const toast = useAppToast()
  return useMutation<Attachment, Error, { transactionId: string; file: File }>({
    mutationKey: mutationKeys.uploadAttachment,
    onSuccess: () => {
      invalidate(queryClient)
      toast.success('Comprovante anexado')
    },
    onError: () => toast.error('Erro ao anexar comprovante'),
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  const toast = useAppToast()
  return useMutation<void, Error, string>({
    mutationKey: mutationKeys.deleteAttachment,
    onSuccess: () => {
      invalidate(queryClient)
      toast.success('Comprovante removido')
    },
    onError: () => toast.error('Erro ao remover comprovante'),
  })
}
