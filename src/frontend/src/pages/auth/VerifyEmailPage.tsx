import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { authApi } from '../../api/auth'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [verified, setVerified] = useState(false)
  const [resent, setResent] = useState(false)

  const verifyMutation = useMutation({
    mutationFn: (t: string) => authApi.verifyEmail(t),
    onSuccess: () => setVerified(true),
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => setResent(true),
  })

  if (token && !verified && !verifyMutation.isPending && !verifyMutation.isSuccess && !verifyMutation.isError) {
    verifyMutation.mutate(token)
  }

  if (verified || verifyMutation.isSuccess) return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
        <span className="text-4xl">✅</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Email verificado!</h1>
      <p className="text-gray-500">Sua conta foi ativada com sucesso.</p>
      <Link to="/login">
        <Button
          fullWidth
          variant="primary"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
        >
          Ir para o login
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
        <span className="text-4xl">📧</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Verifique seu email</h1>
      <p className="text-gray-500">
        Enviamos um link de verificação. Clique no link para ativar sua conta.
      </p>

      {resent ? (
        <p className="text-green-600 text-sm font-medium">✅ Email reenviado com sucesso!</p>
      ) : (
        <Button
          variant="outline"
          fullWidth
          isDisabled={resendMutation.isPending}
          onPress={() => {
            const email = prompt('Digite seu email para reenviar:')
            if (email) resendMutation.mutate(email)
          }}
        >
          Reenviar email
        </Button>
      )}

      <Link to="/login" className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        Voltar para o login
      </Link>
    </div>
  )
}
