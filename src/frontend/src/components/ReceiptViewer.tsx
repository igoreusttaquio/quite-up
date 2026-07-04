import { useEffect, useState } from 'react'
import { X, FileText, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { api } from '../lib/axios'

interface ReceiptViewerProps {
  open: boolean
  onClose: () => void
  attachmentId: string
  fileName: string
  contentType: string
  title?: string
}

export function ReceiptViewer({ open, onClose, attachmentId, fileName, contentType, title }: ReceiptViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !attachmentId) return

    setLoading(true)
    const controller = new AbortController()

    api.get(`/attachments/${attachmentId}`, {
      responseType: 'blob',
      signal: controller.signal,
    })
      .then((res) => {
        const url = URL.createObjectURL(res.data)
        setBlobUrl(url)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      controller.abort()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attachmentId])

  const isImage = contentType.startsWith('image/')
  const isPdf = contentType === 'application/pdf'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); if (blobUrl) URL.revokeObjectURL(blobUrl) } }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} />
            {title || fileName}
          </DialogTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={() => { onClose(); if (blobUrl) URL.revokeObjectURL(blobUrl) }}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto bg-muted/30 rounded-lg flex items-center justify-center">
          {loading ? (
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          ) : !blobUrl ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Erro ao carregar o comprovante.</p>
            </div>
          ) : isImage ? (
            <img
              src={blobUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={fileName}
              className="w-full h-full min-h-[70vh] rounded-lg"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Visualização não disponível para este tipo de arquivo.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = blobUrl
                  a.download = fileName
                  a.click()
                }}
              >
                Baixar arquivo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
