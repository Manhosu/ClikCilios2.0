import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import AuthProvider from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'
import ProtectedRoute from './components/ProtectedRoute'
import WelcomeModal from './components/WelcomeModal'
import { useAuthContext } from './hooks/useAuthContext'

// Páginas
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AplicarCiliosPage from './pages/AplicarCiliosPage'
import ClientesPage from './pages/ClientesPage'
import MinhasImagensPage from './pages/MinhasImagensPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import ParceriasPage from './pages/ParceriasPage'

// Páginas Admin removidas para produção

// Componente para roteamento inteligente na raiz
const SmartRootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuthContext()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  } else {
    return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rotas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/aplicar-cilios" element={
        <ProtectedRoute>
          <AplicarCiliosPage />
        </ProtectedRoute>
      } />
      
      <Route path="/clientes" element={
        <ProtectedRoute>
          <ClientesPage />
        </ProtectedRoute>
      } />
      
      <Route path="/minhas-imagens" element={
        <ProtectedRoute>
          <MinhasImagensPage />
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes" element={
        <ProtectedRoute>
          <ConfiguracoesPage />
        </ProtectedRoute>
      } />
      
      <Route path="/parcerias" element={
        <ProtectedRoute>
          <ParceriasPage />
        </ProtectedRoute>
      } />
      
      {/* Rotas Admin removidas para produção */}
      
      {/* Rota raiz inteligente */}
      <Route path="/" element={<SmartRootRedirect />} />
      
      {/* Rota 404 - redireciona inteligentemente */}
      <Route path="*" element={<SmartRootRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <div className="App">
            <AppRoutes />
            
            {/* Modal de boas-vindas */}
            <WelcomeModal />
              
              {/* Toast notifications */}
              <Toaster position="top-right" richColors />
          </div>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App