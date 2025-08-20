import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { configuracoesService, Configuracoes } from '../services/configuracoesService'
import Button from '../components/Button'

const ConfiguracoesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout, isLoading: userLoading } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  // Variáveis de edição de perfil removidas - funcionalidade desabilitada
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    user_id: '',
    tema: 'claro',
    notificacoes_email: true,
    notificacoes_push: true,
    idioma: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    formato_hora: '24h',
    moeda: 'BRL',
    backup_automatico: true,
    backup_frequencia: 'semanal'
  })
  // Estado de dados do perfil removido - edição desabilitada

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      carregarConfiguracoes()
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
    }
  }, [user, userLoading])

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        return
      }

      const configuracoes = await configuracoesService.obter(user.id)
      setConfiguracoes(configuracoes)
    } catch (error) {
      // Erro ao carregar configurações - log removido para produção
    } finally {
      setLoading(false)
    }
  }

  const salvarConfiguracoes = async () => {
    try {
      setSalvando(true)

      if (!user?.id) {
        alert('Usuário não autenticado')
        return
      }

      const configSalva = await configuracoesService.atualizar(user.id, configuracoes)
      setConfiguracoes(configSalva)

      alert('✅ Configurações salvas com sucesso!')
    } catch (error) {
      // Erro ao salvar configurações - log removido para produção
      alert('❌ Erro ao salvar configurações')
    } finally {
      setSalvando(false)
    }
  }

  // Funções de edição de perfil removidas - funcionalidade desabilitada

  const handleLogout = async () => {
    try {
      await logout()
      
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      // Erro no logout
      // Mesmo com erro, redirecionar
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">
            {userLoading ? 'Carregando usuário...' : 'Carregando configurações...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
            >
              ← Voltar ao Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">⚙️ Gerencie suas preferências e dados da conta</p>
        </div>

        <div className="space-y-6">
          {/* Preferências */}
          <div className="card-elegant p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              🎨 Preferências do Sistema
            </h2>
            
            {/* Salvamento automático removido - apenas salvamento manual disponível */}
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-2xl">
                <div className="text-center py-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    💾 Salvamento de Imagens
                  </h3>
                  <p className="text-sm text-gray-600">
                    As imagens são salvas apenas quando você clicar no botão de salvar
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button 
                onClick={salvarConfiguracoes} 
                variant="primary"
                isLoading={salvando}
                className="shadow-elegant hover:scale-105 transition-transform"
              >
                💾 Salvar Preferências
              </Button>
            </div>
          </div>

          {/* Informações da Conta */}
          <div className="card-elegant p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                👤 Informações da Conta
              </h2>
              <p className="text-sm text-gray-600 mt-1">Dados da sua conta (somente leitura)</p>
            </div>
            
            {/* Modo de visualização apenas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl">
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    ✨ Nome
                  </label>
                  <p className="text-gray-900 font-medium">{user?.nome}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-2xl">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    👑 Tipo de Conta
                  </label>
                  <p className="text-gray-900 font-medium capitalize">{user?.tipo}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    📧 Email
                  </label>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    🔐 Status
                  </label>
                  <p className="text-gray-900 font-medium">
                    ✅ Conta Ativa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações da Conta */}
          <div className="card-elegant p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              🔧 Ações da Conta
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                  <h3 className="font-medium text-orange-800 mb-2 flex items-center">
                    🚪 Sair da Conta
                  </h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Encerrar sua sessão atual no sistema
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    🚪 Fazer Logout
                  </Button>
                </div>
              </div>
              
              {/* Seção de Estatísticas removida - funcionalidade desnecessária */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfiguracoesPage