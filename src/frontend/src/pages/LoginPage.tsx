import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Input,
  Button,
  Field,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components'
import { Link, useNavigate } from 'react-router-dom'
import { LockClosedFilled } from '@fluentui/react-icons'
import { useLogin } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const token = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const login = useLogin()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      await login.mutateAsync(data)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const errorData = axiosError?.response?.data
      if (errorData?.errors) {
        for (const [field, messages] of Object.entries(errorData.errors)) {
          setError(field as keyof FormData, { message: messages[0] })
        }
      } else {
        setError('root', { message: errorData?.message || 'Erro ao fazer login. Tente novamente.' })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <LockClosedFilled className="text-brand" style={{ fontSize: 24 }} />
        </div>
        <div>
          <Text as="h2" size={600} weight="semibold" block>Entrar</Text>
          <Text size={200} className="text-muted mt-0.5 block">
            Acesse sua conta para continuar
          </Text>
        </div>
      </div>

      {errors.root && (
        <MessageBar intent="error">
          <MessageBarBody>{errors.root.message}</MessageBarBody>
        </MessageBar>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Field
              label="E-mail"
              required
              validationState={errors.email ? 'error' : undefined}
              validationMessage={errors.email?.message}
            >
              <Input {...field} type="email" placeholder="seu@email.com" size="large" />
            </Field>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Field
              label="Senha"
              required
              validationState={errors.password ? 'error' : undefined}
              validationMessage={errors.password?.message}
            >
              <Input {...field} type="password" placeholder="Sua senha" size="large" />
            </Field>
          )}
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-brand hover:underline font-medium">
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          appearance="primary"
          className="w-full"
          size="large"
          disabled={login.isPending}
          icon={login.isPending ? <Spinner size="tiny" /> : undefined}
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <Text size={200} className="text-muted text-center block">
        Não tem conta?{' '}
        <Link to="/register" className="text-brand hover:underline font-semibold">
          Cadastre-se grátis
        </Link>
      </Text>
    </div>
  )
}
