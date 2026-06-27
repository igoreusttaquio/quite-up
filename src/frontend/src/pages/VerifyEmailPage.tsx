import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Text, Spinner } from '@fluentui/react-components'
import { CheckmarkCircleFilled, ErrorCircleFilled } from '@fluentui/react-icons'
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
        <ErrorCircleFilled className="text-expense" style={{ fontSize: 56 }} />
        <div>
          <Text as="h2" size={700} weight="semibold" block>Token ausente</Text>
          <Text size={300} className="text-muted mt-2 block">
            O link de verificação é inválido ou já foi utilizado.
          </Text>
        </div>
        <Link to="/login" className="text-brand hover:underline text-sm font-medium">
          Ir para o login
        </Link>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-5 py-8">
        <Spinner size="large" />
        <Text size={300} className="text-muted">Verificando seu e-mail…</Text>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center py-4">
        <CheckmarkCircleFilled className="text-income" style={{ fontSize: 56 }} />
        <div>
          <Text as="h2" size={700} weight="semibold" block>E-mail verificado!</Text>
          <Text size={300} className="text-muted mt-2 block">
            Sua conta está ativa. Faça login para começar.
          </Text>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-brand hover:underline text-sm font-medium"
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
        <ErrorCircleFilled className="text-expense" style={{ fontSize: 56 }} />
        <div>
          <Text as="h2" size={700} weight="semibold" block>Falha na verificação</Text>
          <Text size={300} className="text-muted mt-2 block">
            {apiError?.response?.data?.message || 'O link pode ter expirado. Solicite um novo.'}
          </Text>
        </div>
        <Link to="/login" className="text-brand hover:underline text-sm font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return null
}
