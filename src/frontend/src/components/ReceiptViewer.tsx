import { useEffect, useState } from 'react'
import { FileText, Loader2, Download } from 'lucide-react'
import { ResponsiveDialog } from './ui/responsive-dialog'
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

function download(url: string, fileName: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
}

export function ReceiptViewer({ open, onClose, attachmentId, fileName, contentType, title }: ReceiptViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !attachmentId) return

    setLoading(true)
    const controller = new AbortController()
    let url: string | null = null

    api
      .get(`/attachments/${attachmentId}`, { responseType: 'blob', signal: controller.signal })
      .then((res) => {
        url = URL.createObjectURL(res.data)
        setBlobUrl(url)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
      setBlobUrl(null)
    }
  }, [open, attachmentId])

  const isImage = contentType.startsWith('image/')
  const isPdf = contentType === 'application/pdf'

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      title={title || fileName}
      size="xl"
      headerAside={
        blobUrl ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => download(blobUrl, fileName)}
            aria-label="Baixar comprovante"
            title="Baixar"
          >
            <Download size={16} />
          </Button>
        ) : undefined
      }
    >
      <div className="flex min-h-[50dvh] items-center justify-center overflow-auto rounded-lg bg-muted/30 md:h-[70dvh]">
        {loading ? (
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        ) : !blobUrl ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>Erro ao carregar o comprovante.</p>
          </div>
        ) : isImage ? (
          <img src={blobUrl} alt={fileName} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : isPdf ? (
          <iframe src={blobUrl} title={fileName} className="h-[70dvh] w-full rounded-lg" />
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>Visualização não disponível para este tipo de arquivo.</p>
            <Button variant="outline" className="mt-4" onClick={() => download(blobUrl, fileName)}>
              Baixar arquivo
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  )
}
