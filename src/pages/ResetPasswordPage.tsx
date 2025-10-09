import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasValidToken, setHasValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const navigate = useNavigate()

  // Verificar e processar o token de recuperação
  useEffect(() => {
    const checkRecoveryToken = async () => {
      try {
        // O Supabase detecta automaticamente o hash de recuperação e estabelece a sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
          setHasValidToken(false)
        } else {
          setHasValidToken(true)
        }
      } catch (err) {
        console.error('Erro ao verificar token:', err)
        setError('Erro ao verificar link de recuperação.')
        setHasValidToken(false)
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkRecoveryToken()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    try {
      // Atualizar senha usando o token da URL
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login')
      }, 3000)

    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err)
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading enquanto verifica token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-elegant-gradient px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-elegant-600 font-medium">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-elegant-gradient px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mb-8 shadow-soft">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">Definir Nova Senha</h1>
          <p className="text-elegant-600 text-lg font-medium">
            {success
              ? 'Senha atualizada com sucesso! 🎉'
              : 'Crie uma senha segura para sua conta'
            }
          </p>
        </div>

        <div className="card">
          {!hasValidToken ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-elegant">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">❌</span>
                  <h3 className="text-lg font-bold text-red-800">Link Inválido</h3>
                </div>
                <p className="text-red-700 font-medium mb-4">
                  {error || 'Este link de recuperação é inválido ou já expirou.'}
                </p>
                <div className="space-y-2 text-sm text-red-600">
                  <p>🔄 O link de recuperação expira em 1 hora</p>
                  <p>🔑 Solicite um novo link na página de login</p>
                </div>
              </div>

              <Link
                to="/forgot-password"
                className="btn-primary w-full block text-center"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
              >
                🔑 Solicitar Novo Link
              </Link>

              <Link
                to="/login"
                className="block text-center text-elegant-600 hover:text-primary-600 font-medium transition-colors"
              >
                ← Voltar para o Login
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-elegant">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">✅</span>
                  <h3 className="text-lg font-bold text-green-800">Senha definida!</h3>
                </div>
                <p className="text-green-700 font-medium mb-4">
                  Sua senha foi atualizada com sucesso!
                </p>
                <div className="space-y-2 text-sm text-green-600">
                  <p>✨ Você já pode fazer login com sua nova senha</p>
                  <p>🔄 Redirecionando para o login...</p>
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
                  <span className="text-2xl mr-3">🔒</span>
                  <div className="text-sm text-blue-700">
                    <p className="font-bold mb-2">Dicas para uma senha segura:</p>
                    <ul className="space-y-1 text-blue-600">
                      <li>• Mínimo de 6 caracteres</li>
                      <li>• Use letras maiúsculas e minúsculas</li>
                      <li>• Inclua números e símbolos</li>
                      <li>• Não use informações pessoais óbvias</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-elegant-700 mb-3">
                    🔑 Nova Senha
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input-field"
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-elegant-700 mb-3">
                    🔐 Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="input-field"
                    placeholder="Digite novamente sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                  />
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
                  >
                    {isLoading ? '🔄 Salvando...' : '✅ Definir Senha'}
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

export default ResetPasswordPage
