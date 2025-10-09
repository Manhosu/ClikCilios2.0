import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Verificar se o email existe no sistema (usuário criado via compra)
      const { data: users, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      if (checkError || !users) {
        setError('Email não encontrado. Verifique se você já realizou a compra do acesso.')
        setIsLoading(false)
        return
      }

      // Enviar email de recuperação via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err)
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-elegant-gradient px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mb-8 shadow-soft">
            <span className="text-4xl">🔑</span>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">Recuperar Senha</h1>
          <p className="text-elegant-600 text-lg font-medium">
            {success
              ? 'Email enviado com sucesso! 📧'
              : 'Configure sua senha de acesso'
            }
          </p>
        </div>

        <div className="card">
          {success ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-elegant">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">✅</span>
                  <h3 className="text-lg font-bold text-green-800">Email enviado!</h3>
                </div>
                <p className="text-green-700 font-medium mb-2">
                  Enviamos um link de recuperação para:
                </p>
                <p className="text-green-800 font-bold text-lg mb-4">{email}</p>
                <div className="space-y-2 text-sm text-green-600">
                  <p>📧 Verifique sua caixa de entrada</p>
                  <p>📂 Não esqueça de olhar a pasta de SPAM</p>
                  <p>⏱️ O link expira em 1 hora</p>
                </div>
              </div>

              <Link
                to="/login"
                className="btn-primary w-full block text-center"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
              >
                ← Voltar para o Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-elegant">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">❌</span>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-elegant">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">💡</span>
                  <div className="text-sm text-blue-700">
                    <p className="font-bold mb-2">Para clientes que acabaram de comprar:</p>
                    <p className="mb-2">Use o mesmo email da sua compra para configurar sua senha de acesso.</p>
                    <p className="text-blue-600">Você receberá um link por email para criar sua senha.</p>
                  </div>
                </div>
              </div>

              <form className="space-y-8" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-elegant-700 mb-3">
                    📧 Email usado na compra
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
                  >
                    {isLoading ? '📧 Enviando...' : '🔑 Enviar Link de Recuperação'}
                  </button>

                  <Link
                    to="/login"
                    className="block text-center text-elegant-600 hover:text-primary-600 font-medium transition-colors"
                  >
                    ← Voltar para o Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="text-center text-sm text-elegant-500">
          <p className="font-medium">© 2024 CíliosClick. Todos os direitos reservados. ✨</p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
