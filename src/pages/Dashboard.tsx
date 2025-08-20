import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { useDataContext } from '../contexts/DataContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()
  const { totalClientes, totalImagens, loading, refreshData } = useDataContext()

  // Dados agora são gerenciados pelo DataContext

  const handleLogout = async () => {
    try {
      await logout()
      
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      // Mesmo com erro, redirecionar
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }

  return (
    <div className="min-h-screen bg-elegant-gradient">
      {/* Header com botões essenciais */}
      <div className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-elegant">
                <span className="text-white text-xl">💎</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gradient">CíliosClick</h1>
                <p className="text-sm text-elegant-500 font-medium">{user?.nome || 'Profissional'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/configuracoes')}
                className="flex items-center px-4 py-2 rounded-2xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-all duration-200 font-medium"
              >
                <span className="text-lg mr-2">⚙️</span>
                Configurações
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
              >
                <span className="text-lg mr-2">🚪</span>
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gradient mb-3">Dashboard</h1>
                <p className="text-elegant-600 text-lg">
                  Bem-vinda ao CíliosClick, <span className="font-semibold text-primary-600">{user?.nome?.split(' ')[0] || 'Profissional'}</span>! ✨ Comece criando uma nova visualização.
                </p>
              </div>
              <button
                onClick={refreshData}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                🔄 {loading ? 'Carregando...' : 'Atualizar Dados'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {/* Card Nova Visualização */}
            <div 
              className="card-interactive group" 
              onClick={() => navigate('/aplicar-cilios')}
            >
              <div className="text-center">
                <div className="h-20 w-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft group-hover:shadow-elegant-lg transition-all duration-200">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-elegant-800 mb-3">Nova Visualização</h3>
                <p className="text-elegant-600">Faça upload de uma foto e veja diferentes estilos de cílios</p>
              </div>
            </div>

            {/* Card Minhas Imagens */}
            <div 
              className="card-interactive group" 
              onClick={() => navigate('/minhas-imagens')}
            >
              <div className="text-center">
                <div className="h-20 w-20 bg-gradient-to-r from-accent-400 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft group-hover:shadow-elegant-lg transition-all duration-200">
                  <span className="text-3xl">🖼️</span>
                </div>
                <h3 className="text-xl font-bold text-elegant-800 mb-3">Minhas Imagens</h3>
                <p className="text-elegant-600 mb-4">Visualize e gerencie suas imagens salvas</p>
                <div className="bg-primary-50 rounded-2xl py-3 px-4">
                  <div className="text-3xl font-bold text-primary-600">
                    {loading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      totalImagens
                    )}
                  </div>
                  <div className="text-sm text-elegant-500 font-medium">imagens</div>
                </div>
              </div>
            </div>

            {/* Card Clientes */}
            <div 
              className="card-interactive group" 
              onClick={() => navigate('/clientes')}
            >
              <div className="text-center">
                <div className="h-20 w-20 bg-gradient-to-r from-secondary-400 to-secondary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft group-hover:shadow-elegant-lg transition-all duration-200">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-elegant-800 mb-3">Clientes</h3>
                <p className="text-elegant-600 mb-4">Gerencie informações das suas clientes</p>
                <div className="bg-secondary-50 rounded-2xl py-3 px-4">
                  <div className="text-3xl font-bold text-secondary-600">
                    {loading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      totalClientes
                    )}
                  </div>
                  <div className="text-sm text-elegant-500 font-medium">clientes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações rápidas removidas - funcionalidades já disponíveis nos cards principais */}
        </div>
      </div>
    </div>
  )
}

export default Dashboard