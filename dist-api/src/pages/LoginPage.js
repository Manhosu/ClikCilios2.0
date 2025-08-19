import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage] = useState('');
    const { login, isAuthenticated, isLoading: authLoading } = useAuthContext();
    const navigate = useNavigate();
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, authLoading, navigate]);
    if (authLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>);
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        }
        else {
            setError(result.error || 'Erro no login');
        }
        setIsLoading(false);
    };
    return (<div className="min-h-screen flex items-center justify-center bg-elegant-gradient px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-10">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mb-8 shadow-soft">
            <span className="text-4xl">💎</span>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">CíliosClick</h1>
          <p className="text-elegant-600 text-lg font-medium">Extensão de cílios com inteligência artificial ✨</p>
        </div>

        <div className="card">
          
          {successMessage && (<div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-elegant">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <p className="text-green-700 font-medium">{successMessage}</p>
              </div>
            </div>)}
          
          {error && (<div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-elegant">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>)}

          
            <form className="space-y-8" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-elegant-700 mb-3">
                  📧 E-mail
                </label>
                <input id="email" name="email" type="email" autoComplete="email" required className="input-field" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-elegant-700 mb-3">
                  🔒 Senha
                </label>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
              </div>

              <div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}>
                  {isLoading ? '✨ Entrando...' : '✨ Entrar no CíliosClick'}
                </button>
              </div>

            </form>
        </div>

        
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-elegant mb-6">
            <div className="flex items-center justify-center mb-3">
              <span className="text-2xl mr-2">🛒</span>
              <h3 className="text-lg font-bold text-blue-800">Como obter acesso?</h3>
            </div>
            <p className="text-blue-700 font-medium mb-2">
              As contas são criadas automaticamente após a compra do acesso.
            </p>
            <p className="text-blue-600 text-sm">
              Após a compra, você receberá suas credenciais de login por email.
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-elegant-500">
          <p className="font-medium">© 2024 CíliosClick. Todos os direitos reservados. ✨</p>
          <p className="mt-2 text-xs">Tecnologia de beleza com inteligência artificial</p>
        </div>
      </div>
    </div>);
};
export default LoginPage;
