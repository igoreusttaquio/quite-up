import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2 } from 'lucide-react'
import { useRegister } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Alert, AlertDescription } from '../components/ui/alert'

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const token = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()
  const register = useRegister()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      await register.mutateAsync(data)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const errorData = axiosError?.response?.data
      if (errorData?.errors) {
        for (const [field, messages] of Object.entries(errorData.errors)) {
          setError(field as keyof FormData, { message: messages[0] })
        }
      } else {
        setError('root', { message: errorData?.message || 'Erro ao cadastrar. Tente novamente.' })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <UserPlus className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Criar conta</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Comece a organizar suas finanças hoje</p>
        </div>
      </div>

      {errors.root && (
        <Alert intent="error">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Field
              label="Nome"
              required
              validationState={errors.name ? 'error' : undefined}
              validationMessage={errors.name?.message}
            >
              <Input {...field} placeholder="Seu nome completo" className="h-10" />
            </Field>
          )}
        />

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
              <Input {...field} type="password" placeholder="Mínimo 6 caracteres" className="h-10" />
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Field
              label="Confirmar Senha"
              required
              validationState={errors.confirmPassword ? 'error' : undefined}
              validationMessage={errors.confirmPassword?.message}
            >
              <Input {...field} type="password" placeholder="Repita a senha" className="h-10" />
            </Field>
          )}
        />

        <Button type="submit" className="w-full h-10" disabled={register.isPending}>
          {register.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Cadastrando…
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Já tem conta?{' '}
        <Link to="/login" className="text-primary hover:underline font-semibold">
          Entrar
        </Link>
      </p>
    </div>
  )
}
