import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attachmentsApi } from '../api/attachments'
import { useAppToast } from './useAppToast'

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  const toast = useAppToast()
  return useMutation({
    mutationFn: ({ transactionId, file }: { transactionId: string; file: File }) =>
      attachmentsApi.upload(transactionId, file).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      toast.success('Comprovante anexado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao anexar comprovante.')
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  const toast = useAppToast()
  return useMutation({
    mutationFn: (transactionId: string) => attachmentsApi.deleteByTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      toast.success('Comprovante removido!')
    },
    onError: () => {
      toast.error('Erro ao remover comprovante.')
    },
  })
}
