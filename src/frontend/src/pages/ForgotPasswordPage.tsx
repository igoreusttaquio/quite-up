import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useForgotPassword } from '../hooks/useAuth'

const schema = z.object({ email: z.string().email('E-mail inválido') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try { await forgotPassword.mutateAsync(data) }
    catch { setError('root', { message: 'Erro ao enviar recuperação.' }) }
  }

  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-6 text-center py-4">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <div>
          <h2 className="text-xl font-semibold tracking-tight">E-mail enviado!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
        </div>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-block">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recuperar Senha</h2>
          <p className="text-sm text-muted-foreground mt-1">Informe seu e-mail e enviaremos um link de recuperação</p>
        </div>
      </div>

      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? 'Enviando…' : 'Enviar Link'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Lembrou a senha?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
      </p>
    </div>
  )
}
