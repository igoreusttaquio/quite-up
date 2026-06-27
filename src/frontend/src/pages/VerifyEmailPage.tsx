import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useVerifyEmail } from '../hooks/useAuth'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { mutate, isPending, isSuccess, isError, error } = useVerifyEmail()

  useEffect(() => {
    if (token) mutate({ token })
  }, [token, mutate])

  if (!token) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Token de verificação ausente.</p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando seu e-mail...</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center py-4">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <p className="text-lg font-semibold text-emerald-600">E-mail verificado com sucesso!</p>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-block">
          Ir para login
        </Link>
      </div>
    )
  }

  if (isError) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return (
      <div className="space-y-4 text-center py-4">
        <XCircle className="h-14 w-14 text-destructive mx-auto" />
        <p className="text-sm text-destructive">{apiError?.response?.data?.message || 'Erro ao verificar e-mail.'}</p>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-block">
          Voltar para login
        </Link>
      </div>
    )
  }

  return null
}
