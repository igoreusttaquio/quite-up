import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useVerifyEmail } from '../hooks/useAuth'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { mutate, isPending, isSuccess, isError, error } = useVerifyEmail()

  useEffect(() => {
    if (token) mutate({ token })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token) {
    return (
      <div className="space-y-5 text-center py-4">
        <XCircle className="text-expense mx-auto" size={56} />
        <div>
          <h2 className="text-2xl font-semibold">Token ausente</h2>
          <p className="text-sm text-muted-foreground mt-2">
            O link de verificação é inválido ou já foi utilizado.
          </p>
        </div>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium">
          Ir para o login
        </Link>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-5 py-8">
        <Loader2 className="text-primary animate-spin" size={40} />
        <p className="text-sm text-muted-foreground">Verificando seu e-mail…</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center py-4">
        <CheckCircle2 className="text-income mx-auto" size={56} />
        <div>
          <h2 className="text-2xl font-semibold">E-mail verificado!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Sua conta está ativa. Faça login para começar.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
        >
          Ir para o login →
        </Link>
      </div>
    )
  }

  if (isError) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return (
      <div className="space-y-5 text-center py-4">
        <XCircle className="text-expense mx-auto" size={56} />
        <div>
          <h2 className="text-2xl font-semibold">Falha na verificação</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {apiError?.response?.data?.message || 'O link pode ter expirado. Solicite um novo.'}
          </p>
        </div>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return null
}
