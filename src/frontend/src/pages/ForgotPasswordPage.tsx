import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { useForgotPassword } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Alert, AlertDescription } from '../components/ui/alert'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword.mutateAsync(data)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError('root', { message: axiosError?.response?.data?.message || 'Erro ao enviar recuperação.' })
    }
  }

  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-6 text-center py-4">
        <CheckCircle2 className="text-income mx-auto" size={56} />
        <div>
          <h2 className="text-2xl font-semibold">E-mail enviado!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
        </div>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
          <Mail className="text-primary" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Recuperar Senha</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Informe seu e-mail e enviaremos um link de recuperação
          </p>
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

        <Button type="submit" className="w-full h-10" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando…
            </>
          ) : (
            'Enviar Link'
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Lembrou a senha?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
