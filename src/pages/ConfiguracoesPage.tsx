import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { useAdmin } from '../hooks/useAdmin'
import Button from '../components/Button'
import Input from '../components/Input'
import { supabase } from '../lib/supabase'

const ConfiguracoesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout, isLoading: userLoading } = useAuthContext()
  const { isAdmin } = useAdmin()
  const [loading, setLoading] = useState(true)

  // Estado para criação de usuário (admin)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createUserData, setCreateUserData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'usuario' as 'usuario' | 'admin'
  })
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserMessage, setCreateUserMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    if (!userLoading && user) {
      setLoading(false)
    } else if (!userLoading && !user) {
      navigate('/login')
    }
  }, [user, userLoading])

  // Função para criar novo usuário (admin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateUserLoading(true)
    setCreateUserMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createUserData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      setCreateUserMessage({ type: 'success', text: 'Usuário criado com sucesso!' })
      setCreateUserData({
        nome: '',
        email: '',
        senha: '',
        tipo: 'usuario'
      })

      // Fechar o formulário após 2 segundos
      setTimeout(() => {
        setShowCreateUser(false)
        setCreateUserMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      setCreateUserMessage({
        type: 'error',
        text: error.message || 'Erro ao criar usuário. Tente novamente.'
      })
    } finally {
      setCreateUserLoading(false)
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
          <p className="text-gray-600 mt-2">Gerencie suas preferências e dados da conta</p>
        </div>

        <div className="space-y-6">

          {/* Informações da Conta */}
          <div className="card-elegant p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                Informações da Conta
              </h2>
              <p className="text-sm text-gray-600 mt-1">Dados da sua conta (somente leitura)</p>
            </div>

            {/* Modo de visualização apenas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl">
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Nome
                  </label>
                  <p className="text-gray-900 font-medium">{user?.nome}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-2xl">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Tipo de Conta
                  </label>
                  <p className="text-gray-900 font-medium capitalize">{user?.tipo}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Status
                  </label>
                  <p className="text-gray-900 font-medium">
                    Conta Ativa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestão de Usuários (Admin) */}
          {isAdmin && (
            <div className="card-elegant p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  Gestão de Usuários
                </h2>
                <p className="text-sm text-gray-600 mt-1">Criar novos usuários manualmente</p>
              </div>

              {!showCreateUser ? (
                <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <h3 className="font-medium text-purple-800 mb-2">
                    Criar Nova Conta
                  </h3>
                  <p className="text-sm text-purple-700 mb-4">
                    Crie contas para novos usuários sem necessidade de compra
                  </p>
                  <Button
                    onClick={() => setShowCreateUser(true)}
                    variant="primary"
                    className="w-full"
                  >
                    + Criar Novo Usuário
                  </Button>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-gray-200">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo
                      </label>
                      <Input
                        type="text"
                        value={createUserData.nome}
                        onChange={(e) => setCreateUserData({...createUserData, nome: e.target.value})}
                        placeholder="Digite o nome completo"
                        required
                        disabled={createUserLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={createUserData.email}
                        onChange={(e) => setCreateUserData({...createUserData, email: e.target.value})}
                        placeholder="Digite o email"
                        required
                        disabled={createUserLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                      </label>
                      <Input
                        type="password"
                        value={createUserData.senha}
                        onChange={(e) => setCreateUserData({...createUserData, senha: e.target.value})}
                        placeholder="Digite a senha (mínimo 6 caracteres)"
                        required
                        minLength={6}
                        disabled={createUserLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Conta
                      </label>
                      <select
                        value={createUserData.tipo}
                        onChange={(e) => setCreateUserData({...createUserData, tipo: e.target.value as 'usuario' | 'admin'})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        disabled={createUserLoading}
                      >
                        <option value="usuario">Usuário</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    {createUserMessage && (
                      <div className={`p-4 rounded-lg ${
                        createUserMessage.type === 'success'
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {createUserMessage.text}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={createUserLoading}
                      >
                        {createUserLoading ? 'Criando...' : 'Criar Usuário'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowCreateUser(false)
                          setCreateUserMessage(null)
                          setCreateUserData({
                            nome: '',
                            email: '',
                            senha: '',
                            tipo: 'usuario'
                          })
                        }}
                        disabled={createUserLoading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Ações da Conta */}
          <div className="card-elegant p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              Ações da Conta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                  <h3 className="font-medium text-orange-800 mb-2 flex items-center">
                    Sair da Conta
                  </h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Encerrar sua sessão atual no sistema
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Fazer Logout
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
