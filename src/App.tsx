import { Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import WelcomeModal from './components/WelcomeModal'

// Páginas
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AplicarCiliosPage from './pages/AplicarCiliosPage'
import ClientesPage from './pages/ClientesPage'
import MinhasImagensPage from './pages/MinhasImagensPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import ParceriasPage from './pages/ParceriasPage'

// Páginas Admin
import AdminCuponsPage from './pages/AdminCuponsPage'
import AdminEmailsPage from './pages/AdminEmailsPage'
import AdminRelatorioCuponsPage from './pages/AdminRelatorioCuponsPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
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
            
            {/* Rotas Admin */}
            <Route path="/admin/cupons" element={
              <ProtectedRoute>
                <AdminCuponsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/emails" element={
              <ProtectedRoute>
                <AdminEmailsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/relatorio-cupons" element={
              <ProtectedRoute>
                <AdminRelatorioCuponsPage />
              </ProtectedRoute>
            } />
            
            {/* Rota padrão */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rota 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Modal de boas-vindas */}
          <WelcomeModal />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App