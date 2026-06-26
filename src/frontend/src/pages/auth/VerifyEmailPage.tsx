import { useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useState } from 'react'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [verified, setVerified] = useState(!!token)

  const verifyMutation = useMutation({
    mutationFn: (t: string) => authApi.verifyEmail(t),
    onSuccess: () => setVerified(true),
  })

  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
  })

  if (token && !verified && !verifyMutation.isPending) {
    verifyMutation.mutate(token)
  }

  return (
    <div className="text-center space-y-5">
      {verified || verifyMutation.isSuccess ? (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email verificado!</h1>
          <p className="text-gray-500">Sua conta foi ativada. Você já pode fazer login.</p>
          <Link
            to="/login"
            className="block w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Ir para o login
          </Link>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verifique seu email</h1>
          <p className="text-gray-500">
            Enviamos um link de verificação para seu email. Clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => {
              const email = prompt('Digite seu email para reenviar:')
              if (email) resendMutation.mutate(email)
            }}
            disabled={resendMutation.isPending}
            className="w-full border border-indigo-600 text-indigo-600 py-2.5 rounded-lg font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {resendMutation.isPending ? 'Enviando...' : 'Reenviar email'}
          </button>
          <Link to="/login" className="block text-sm text-indigo-600 hover:underline">
            Voltar para o login
          </Link>
        </>
      )}
    </div>
  )
}
