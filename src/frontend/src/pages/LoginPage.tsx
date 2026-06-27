import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Loader2 } from 'lucide-react'
import { useLogin } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Alert, AlertDescription } from '../components/ui/alert'

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
          <Lock className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Acesse sua conta para continuar</p>
        </div>
      </div>

      {errors.root && (
        <Alert intent="error">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
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
              <Input {...field} type="email" placeholder="seu@email.com" className="h-10" />
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
              <Input {...field} type="password" placeholder="Sua senha" className="h-10" />
            </Field>
          )}
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" className="w-full h-10" disabled={login.isPending}>
          {login.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Não tem conta?{' '}
        <Link to="/register" className="text-primary hover:underline font-semibold">
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  )
}
