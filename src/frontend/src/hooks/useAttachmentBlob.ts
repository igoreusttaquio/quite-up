import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/axios'

/** Baixa o comprovante (com auth) e devolve um object URL; o blob fica em cache. */
export function useAttachmentBlob(attachmentId: string | undefined) {
  const query = useQuery({
    queryKey: ['attachment-blob', attachmentId],
    queryFn: () => api.get<Blob>(`/attachments/${attachmentId}`, { responseType: 'blob' }).then((r) => r.data),
    enabled: !!attachmentId,
    staleTime: Infinity,
  })

  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!query.data) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(query.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [query.data])

  return { url, blob: query.data, isLoading: query.isLoading, isError: query.isError }
}
