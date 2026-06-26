import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button, Field, Text, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
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
      } else if (errorData?.message) {
        setError('root', { message: errorData.message })
      } else {
        setError('root', { message: 'Erro ao fazer login. Tente novamente.' })
      }
    }
  }

  return (
    <div>
      <Text as="h2" size={600} weight="semibold" block className="mb-6 text-center">
        Entrar
      </Text>

      {errors.root && (
        <MessageBar intent="error" className="mb-4">
          <MessageBarBody>{errors.root.message}</MessageBarBody>
        </MessageBar>
      )}

      <div onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
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
                <Input {...field} type="email" placeholder="seu@email.com" />
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
                <Input {...field} type="password" placeholder="Sua senha" />
              </Field>
            )}
          />
        </div>

        <div className="text-right mt-2">
          <Link to="/forgot-password" style={{ color: 'var(--colorBrandForeground1)', fontSize: '0.875rem' }}>
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          appearance="primary"
          className="w-full mt-6"
          size="large"
          onClick={handleSubmit(onSubmit)}
          disabled={login.isPending}
        >
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </div>

      <div className="text-center mt-6">
        <Text size={200}>
          Não tem conta?{' '}
          <Link to="/register" style={{ color: 'var(--colorBrandForeground1)' }}>
            Cadastre-se
          </Link>
        </Text>
      </div>
    </div>
  )
}
