import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Text, MessageBar, MessageBarBody, Spinner } from '@fluentui/react-components'
import { useVerifyEmail } from '../hooks/useAuth'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const verifyEmail = useVerifyEmail()

  useEffect(() => {
    if (token) {
      verifyEmail.mutate({ token })
    }
  }, [token, verifyEmail])

  if (!token) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>Token de verificação ausente.</MessageBarBody>
      </MessageBar>
    )
  }

  if (verifyEmail.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Spinner size="large" />
        <Text size={300}>Verificando seu e-mail...</Text>
      </div>
    )
  }

  if (verifyEmail.isSuccess) {
    return (
      <div className="space-y-4">
        <MessageBar intent="success">
          <MessageBarBody>E-mail verificado com sucesso!</MessageBarBody>
        </MessageBar>
        <div className="text-center">
          <Link to="/login" style={{ color: 'var(--colorBrandForeground1)' }}>
            Ir para login
          </Link>
        </div>
      </div>
    )
  }

  if (verifyEmail.isError) {
    const error = verifyEmail.error as { response?: { data?: { message?: string } } }
    return (
      <div className="space-y-4">
        <MessageBar intent="error">
          <MessageBarBody>
            {error?.response?.data?.message || 'Erro ao verificar e-mail.'}
          </MessageBarBody>
        </MessageBar>
        <div className="text-center">
          <Link to="/login" style={{ color: 'var(--colorBrandForeground1)' }}>
            Voltar para login
          </Link>
        </div>
      </div>
    )
  }

  return null
}
