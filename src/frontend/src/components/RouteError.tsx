import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { Button } from './ui/button'

/**
 * Tela de erro das rotas: substitui a página padrão do React Router ("Unexpected
 * Application Error") por algo amigável, com opção de recarregar.
 */
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Erro inesperado.'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-expense-subtle text-expense">
        <TriangleAlert size={26} />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Não conseguimos exibir esta tela. Tente recarregar; se o problema continuar, volte para o início.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
        <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>
          Ir para o início
        </Button>
      </div>
      <details className="max-w-md text-xs text-muted-foreground">
        <summary className="cursor-pointer">Detalhes técnicos</summary>
        <p className="mt-2 break-words">{message}</p>
      </details>
    </div>
  )
}
