import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Minus, Plus, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

const OUTPUT_SIZE = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 3

interface ProfilePhotoEditorProps {
  open: boolean
  file: File | null
  uploading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void
}

export function ProfilePhotoEditor({
  open,
  file,
  uploading,
  onOpenChange,
  onConfirm,
}: ProfilePhotoEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinch = useRef<{ distance: number; zoom: number } | null>(null)

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState(288)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!file) {
      setImage(null)
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = url

    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => setViewportSize(el.getBoundingClientRect().width)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  const baseScale = image
    ? Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight)
    : 1
  const displayScale = baseScale * zoom
  const displayWidth = image ? image.naturalWidth * displayScale : 0
  const displayHeight = image ? image.naturalHeight * displayScale : 0
  const maxOffsetX = Math.max(0, (displayWidth - viewportSize) / 2)
  const maxOffsetY = Math.max(0, (displayHeight - viewportSize) / 2)

  const clampOffset = useCallback(
    (next: { x: number; y: number }) => ({
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, next.x)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, next.y)),
    }),
    [maxOffsetX, maxOffsetY]
  )

  useEffect(() => {
    setOffset((current) => clampOffset(current))
  }, [clampOffset])

  const updateZoom = (next: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom }
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(e.pointerId)
    if (!previous) return

    const next = { x: e.clientX, y: e.clientY }

    if (pointers.current.size >= 2) {
      pointers.current.set(e.pointerId, next)
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current && pinch.current.distance > 0) {
        updateZoom(pinch.current.zoom * (distance / pinch.current.distance))
      }
      return
    }

    pointers.current.set(e.pointerId, next)
    setOffset((current) =>
      clampOffset({
        x: current.x + (next.x - previous.x),
        y: current.y + (next.y - previous.y),
      })
    )
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((current) =>
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * (e.deltaY < 0 ? 1.08 : 1 / 1.08)))
      )
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open])

  const handleConfirm = () => {
    if (!image) return
    setBusy(true)

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setBusy(false)
      return
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const ratio = OUTPUT_SIZE / viewportSize
    const x = (viewportSize / 2 + offset.x - displayWidth / 2) * ratio
    const y = (viewportSize / 2 + offset.y - displayHeight / 2) * ratio
    ctx.drawImage(image, x, y, displayWidth * ratio, displayHeight * ratio)

    canvas.toBlob(
      (blob) => {
        setBusy(false)
        if (!blob) return
        onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.9
    )
  }

  const handleOpenChange = (next: boolean) => {
    if (busy || uploading) return
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-square w-full max-w-[288px] touch-none select-none overflow-hidden rounded-full border border-border bg-muted cursor-grab active:cursor-grabbing"
          >
            {image ? (
              <img
                src={image.src}
                alt="Pré-visualização da foto"
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Carregando…
              </div>
            )}
          </div>

          <div className="flex w-full max-w-[288px] items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => updateZoom(zoom - 0.15)}
              aria-label="Diminuir zoom"
            >
              <Minus size={14} />
            </Button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => updateZoom(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-label="Zoom"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => updateZoom(zoom + 0.15)}
              aria-label="Aumentar zoom"
            >
              <Plus size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setZoom(1)
                setOffset({ x: 0, y: 0 })
              }}
              aria-label="Restaurar ajuste"
            >
              <RotateCcw size={14} />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Arraste para posicionar e use o zoom para ajustar o enquadramento.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!image || busy || uploading}
            icon={busy || uploading ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {uploading ? 'Salvando…' : 'Salvar foto'}
          </Button>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={busy || uploading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
