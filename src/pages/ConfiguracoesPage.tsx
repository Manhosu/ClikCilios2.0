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
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
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
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    email: ''
  })

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      carregarConfiguracoes()
      setDadosPerfil({
        nome: user.nome || '',
        email: user.email || ''
      })
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

  const salvarPerfil = async () => {
    try {
      setSalvandoPerfil(true)

      if (!user?.id) {
        alert('Usuário não autenticado')
        return
      }

      // Validações
      if (!dadosPerfil.nome.trim()) {
        alert('❌ Nome é obrigatório')
        return
      }

      if (!dadosPerfil.email.trim()) {
        alert('❌ Email é obrigatório')
        return
      }

      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(dadosPerfil.email)) {
        alert('❌ Email inválido')
        return
      }

      // TODO: Implementar integração com Supabase quando estiver em produção
      // const { error } = await supabase.from('users').update({
      //   nome: dadosPerfil.nome,
      //   email: dadosPerfil.email
      // }).eq('id', user.id)
      
      alert('⚠️ Atualização de perfil ainda não implementada para produção')

    } catch (error) {
      // Erro ao salvar perfil - log removido para produção
      alert('❌ Erro ao salvar dados da conta')
    } finally {
      setSalvandoPerfil(false)
    }
  }

  const cancelarEdicao = () => {
    setDadosPerfil({
      nome: user?.nome || '',
      email: user?.email || ''
    })
    setEditandoPerfil(false)
  }

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
            
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                      💾 Salvamento Automático
                    </h3>
                    <p className="text-sm text-gray-600">
                      Salvar imagens automaticamente após processamento com IA
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={configuracoes.backup_automatico}
                      onChange={(e) => setConfiguracoes(prev => ({ 
                        ...prev, 
                        backup_automatico: e.target.checked 
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 shadow-lg"></div>
                  </label>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                👤 Informações da Conta
              </h2>
              {!editandoPerfil && (
                <Button
                  onClick={() => setEditandoPerfil(true)}
                  variant="secondary"
                  className="hover:scale-105 transition-transform"
                >
                  ✏️ Editar
                </Button>
              )}
            </div>
            
            {editandoPerfil ? (
              // Modo de edição
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ✨ Nome *
                    </label>
                    <input
                      type="text"
                      value={dadosPerfil.nome}
                      onChange={(e) => setDadosPerfil(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email *
                    </label>
                    <input
                      type="email"
                      value={dadosPerfil.email}
                      onChange={(e) => setDadosPerfil(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Campos não editáveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                  <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-2xl">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      👑 Tipo de Conta
                    </label>
                    <p className="text-gray-900 font-medium capitalize">{user?.tipo}</p>
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

                {/* Botões de ação */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={cancelarEdicao}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={salvarPerfil}
                    variant="primary"
                    isLoading={salvandoPerfil}
                    className="flex-1 shadow-elegant hover:scale-105 transition-transform"
                  >
                    💾 Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              // Modo de visualização
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
            )}
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
              
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                    📊 Estatísticas
                  </h3>
                  <p className="text-sm text-purple-700 mb-4">
                    Visualizar dados de uso da sua conta
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="secondary"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    📈 Ver Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfiguracoesPage