import { Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AplicarCiliosPage from './pages/AplicarCiliosPage'
import MinhasImagensPage from './pages/MinhasImagensPage'
import ClientesPage from './pages/ClientesPage'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import AdminCuponsPage from './pages/AdminCuponsPage'
import AdminRelatorioCuponsPage from './pages/AdminRelatorioCuponsPage'
import AdminWebhookTestePage from './pages/AdminWebhookTestePage'
import AdminTestePage from './pages/AdminTestePage'
import AdminEmailsPage from './pages/AdminEmailsPage'
import ParceriasPage from './pages/ParceriasPage'
import WelcomeModal from './components/WelcomeModal'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parcerias" element={<ParceriasPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/aplicar-cilios" 
            element={
              <ProtectedRoute>
                <AplicarCiliosPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/minhas-imagens" 
            element={
              <ProtectedRoute>
                <MinhasImagensPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clientes" 
            element={
              <ProtectedRoute>
                <ClientesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/configuracoes" 
            element={
              <ProtectedRoute>
                <ConfiguracoesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cupons" 
            element={
              <ProtectedRoute>
                <AdminCuponsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/relatorio-cupons" 
            element={
              <ProtectedRoute>
                <AdminRelatorioCuponsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/webhook-teste" 
            element={
              <ProtectedRoute>
                <AdminWebhookTestePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/testes" 
            element={
              <ProtectedRoute>
                <AdminTestePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/emails" 
            element={
              <ProtectedRoute>
                <AdminEmailsPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
        
        {/* Modal de Boas-vindas */}
        <WelcomeModal />
      </div>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App 