import { X, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { attachmentsApi } from '../api/attachments'

interface ReceiptViewerProps {
  open: boolean
  onClose: () => void
  attachmentId: string
  fileName: string
  contentType: string
  title?: string
}

export function ReceiptViewer({ open, onClose, attachmentId, fileName, contentType, title }: ReceiptViewerProps) {
  const isImage = contentType.startsWith('image/')
  const isPdf = contentType === 'application/pdf'
  const fileUrl = attachmentsApi.getUrl(attachmentId)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} />
            {title || fileName}
          </DialogTitle>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
              Abrir em nova aba
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto bg-muted/30 rounded-lg flex items-center justify-center">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
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
                onClick={() => window.open(fileUrl, '_blank')}
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
