import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [nome, setNome] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const { login, register, resetPassword, isAuthenticated } = useAuth()
  console.log('🔐 LoginPage: isAuthenticated =', isAuthenticated)

  // Redirecionar se já autenticado
  if (isAuthenticated) {
    console.log('✅ LoginPage: Usuário já autenticado, redirecionando para dashboard')
    window.location.href = '/dashboard'
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 100)
    } else {
      setError(result.error || 'Erro no login')
    }
    
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await register(email, password, nome)
    
    if (result.success) {
      setSuccessMessage('Cadastro realizado! Verifique seu email para confirmar a conta.')
      setShowRegister(false)
      setEmail('')
      setPassword('')
      setNome('')
    } else {
      setError(result.error || 'Erro no cadastro')
    }
    
    setIsLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await resetPassword(email)
    
    if (result.success) {
      setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.')
      setShowForgotPassword(false)
      setEmail('')
    } else {
      setError(result.error || 'Erro ao enviar email')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-elegant-gradient px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mb-8 shadow-soft">
            <span className="text-4xl">💎</span>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">CíliosClick</h1>
          <p className="text-elegant-600 text-lg font-medium">Extensão de cílios com inteligência artificial ✨</p>
        </div>

        <div className="card">
          {/* Mensagens de Sucesso e Erro */}
          {successMessage && (
            <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-elegant">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-elegant">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Formulário de Esqueci Senha */}
          {showForgotPassword ? (
            <form className="space-y-8" onSubmit={handleForgotPassword}>
              <h2 className="text-2xl font-bold text-elegant-800 mb-6 text-center">Recuperar Senha</h2>
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-elegant-700 mb-3">
                  📧 E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
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
                  {isLoading ? '💌 Enviando...' : '💌 Enviar Email de Recuperação'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="btn-secondary w-full"
                >
                  ← Voltar ao Login
                </button>
              </div>
            </form>
          ) : showRegister ? (
            /* Formulário de Registro */
            <form className="space-y-8" onSubmit={handleRegister}>
              <h2 className="text-2xl font-bold text-elegant-800 mb-6 text-center">Criar Conta</h2>
              
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold text-elegant-700 mb-3">
                  👤 Nome Completo
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-elegant-700 mb-3">
                  📧 E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-elegant-700 mb-3">
                  🔒 Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {isLoading ? '✨ Criando conta...' : '✨ Criar Conta'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="btn-secondary w-full"
                >
                  ← Já tenho conta
                </button>
              </div>
            </form>
          ) : (
            /* Formulário de Login */
            <form className="space-y-8" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-elegant-700 mb-3">
                  📧 E-mail
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

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-elegant-700 mb-3">
                  🔒 Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
                >
                  {isLoading ? '✨ Entrando...' : '✨ Entrar no CíliosClick'}
                </button>
              </div>

              <div className="space-y-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="block w-full text-sm font-medium text-primary-600 hover:text-secondary-600 transition-colors duration-200"
                >
                  💭 Esqueci minha senha
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="block w-full text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors duration-200"
                >
                  ✨ Não tenho conta - Criar agora
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-elegant-500">
          <p className="font-medium">© 2024 CíliosClick. Todos os direitos reservados. ✨</p>
          <p className="mt-2 text-xs">Tecnologia de beleza com inteligência artificial</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage