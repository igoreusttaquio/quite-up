import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { useResetPassword } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Alert, AlertDescription } from '../components/ui/alert'

const schema = z
  .object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmNewPassword: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Senhas não conferem',
    path: ['confirmNewPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const resetPassword = useResetPassword()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword.mutateAsync({ token, ...data })
      navigate('/login')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError('root', { message: axiosError?.response?.data?.message || 'Erro ao redefinir senha.' })
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center py-4">
        <Alert intent="error">
          <AlertDescription>Token de recuperação inválido ou ausente.</AlertDescription>
        </Alert>
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <KeyRound className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Redefinir Senha</h2>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta</p>
        </div>
      </div>

      {errors.root && (
        <Alert intent="error">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="newPassword"
          control={control}
          render={({ field }) => (
            <Field
              label="Nova Senha"
              required
              validationState={errors.newPassword ? 'error' : undefined}
              validationMessage={errors.newPassword?.message}
            >
              <Input {...field} type="password" placeholder="Mínimo 6 caracteres" className="h-10" />
            </Field>
          )}
        />

        <Controller
          name="confirmNewPassword"
          control={control}
          render={({ field }) => (
            <Field
              label="Confirmar Nova Senha"
              required
              validationState={errors.confirmNewPassword ? 'error' : undefined}
              validationMessage={errors.confirmNewPassword?.message}
            >
              <Input {...field} type="password" placeholder="Repita a nova senha" className="h-10" />
            </Field>
          )}
        />

        <Button type="submit" className="w-full h-10" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Redefinindo…
            </>
          ) : (
            'Redefinir Senha'
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        <Link to="/login" className="text-primary hover:underline font-medium">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
