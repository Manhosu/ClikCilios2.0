import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { clientesService } from '../services/clientesService'
import { imagensService } from '../services/imagensService'

const Dashboard = () => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isLoading: userLoading } = useAuth()
  const { isAdmin } = useAdmin()
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalImagens, setTotalImagens] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      carregarDadosDashboard()
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
      setTotalClientes(0)
      setTotalImagens(0)
    }
  }, [user, userLoading])

  // Criar dados de exemplo se não existirem (apenas em desenvolvimento)
  useEffect(() => {
    if (!userLoading && user?.id) {
      // Dados de exemplo removidos para produção
    }
  }, [user, userLoading])

  const carregarDadosDashboard = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setTotalClientes(0)
        setTotalImagens(0)
        return
      }

      // Carregar dados em paralelo
      const [clientes, imagens] = await Promise.all([
        clientesService.listar(user.id),
        imagensService.listar(user.id)
      ])

      setTotalClientes(clientes.length)
      setTotalImagens(imagens.length)
    } catch (error) {
      setTotalClientes(0)
      setTotalImagens(0)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="flex h-screen bg-elegant-gradient">
      {/* Sidebar */}
      <div className={`bg-white shadow-soft transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 border-b border-primary-100">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-elegant">
              <span className="text-white text-xl">💎</span>
            </div>
            {sidebarOpen && (
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gradient">CíliosClick</h1>
                <p className="text-sm text-elegant-500 font-medium">{user?.nome || 'Profissional'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`mt-6 p-3 rounded-2xl bg-primary-50 hover:bg-primary-100 transition-all duration-200 text-primary-600 ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-6">
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => navigate('/aplicar-cilios')}
                className={`sidebar-item-active w-full ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20">
                  <span className="text-lg">✨</span>
                </div>
                {sidebarOpen && <span className="ml-3">Nova Visualização</span>}
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/minhas-imagens')}
                className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                  <span className="text-lg">🖼️</span>
                </div>
                {sidebarOpen && <span className="ml-3">Minhas Imagens</span>}
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/clientes')}
                className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                  <span className="text-lg">👥</span>
                </div>
                {sidebarOpen && <span className="ml-3">Clientes</span>}
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/configuracoes')}
                className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                  <span className="text-lg">⚙️</span>
                </div>
                {sidebarOpen && <span className="ml-3">Configurações</span>}
              </button>
            </li>
            {isAdmin && (
              <>
                <li className="pt-6 border-t border-primary-100">
                  <div className={`text-xs font-semibold text-elegant-500 uppercase tracking-wider mb-4 ${!sidebarOpen ? 'text-center' : ''}`}>
                    {sidebarOpen ? 'Administração' : '⚙️'}
                  </div>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/admin/cupons')}
                    className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                      <span className="text-lg">🎫</span>
                    </div>
                    {sidebarOpen && <span className="ml-3">Gerenciar Cupons</span>}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/admin/relatorio-cupons')}
                    className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                      <span className="text-lg">📊</span>
                    </div>
                    {sidebarOpen && <span className="ml-3">Relatório Cupons</span>}
                  </button>
                </li>
                {/* Botões de teste removidos para produção */}
                <li>
                  <button
                    onClick={() => navigate('/admin/emails')}
                    className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                      <span className="text-lg">📧</span>
                    </div>
                    {sidebarOpen && <span className="ml-3">Templates Email</span>}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/admin/hotmart')}
                    className={`sidebar-item w-full ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl">
                      <span className="text-lg">🔗</span>
                    </div>
                    {sidebarOpen && <span className="ml-3">Integração Hotmart</span>}
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="p-6 border-t border-primary-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center p-3 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl">
              <span className="text-lg">🚪</span>
            </div>
            {sidebarOpen && <span className="ml-3">Sair</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
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
                onClick={carregarDadosDashboard}
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

          {/* Área de ações rápidas */}
          <div className="card">
            <h2 className="text-2xl font-bold text-elegant-800 mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/aplicar-cilios')}
                className="btn-primary gradient"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' }}
              >
                ✨ Nova Visualização
              </button>
              <button 
                onClick={() => navigate('/minhas-imagens')}
                className="btn-secondary"
              >
                📁 Gerenciar Imagens
              </button>
              <button 
                onClick={() => navigate('/clientes')}
                className="btn-secondary"
              >
                👥 Ver Clientes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard