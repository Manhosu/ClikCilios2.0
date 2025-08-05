import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { clientesService, Cliente } from '../services/clientesService'
import Button from '../components/Button'

const ClientesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isLoading: userLoading } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [busca, setBusca] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    observacoes: ''
  })

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      carregarClientes()
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
      setClientes([])
    }
  }, [user, userLoading])

  const carregarClientes = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setClientes([])
        return
      }

      const clientes = await clientesService.listar(user.id)
      setClientes(clientes)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (cliente?: Cliente) => {
    if (cliente) {
      setClienteEditando(cliente)
      setFormData({
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        data_nascimento: cliente.data_nascimento || '',
        observacoes: cliente.observacoes || ''
      })
    } else {
      setClienteEditando(null)
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        observacoes: ''
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setClienteEditando(null)
  }

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório')
      return
    }

    if (!user?.id) {
      alert('Usuário não autenticado')
      return
    }

    try {
      if (clienteEditando) {
        await clientesService.atualizar(clienteEditando.id, {
          nome: formData.nome,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          data_nascimento: formData.data_nascimento || undefined,
          observacoes: formData.observacoes || undefined
        })
      } else {
        await clientesService.criar(user.id, {
          nome: formData.nome,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          data_nascimento: formData.data_nascimento || undefined,
          observacoes: formData.observacoes || undefined
        })
      }

      await carregarClientes()
      fecharModal()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente. Tente novamente.')
    }
  }

  const excluirCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const sucesso = await clientesService.excluir(id)
      if (sucesso) {
        await carregarClientes()
      } else {
        alert('Cliente não encontrado')
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente. Tente novamente.')
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone?.includes(busca)
  )

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">
            {userLoading ? 'Carregando usuário...' : 'Carregando clientes...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="mb-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
              >
                ← Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Minhas Clientes
            </h1>
            <p className="text-gray-600 mt-2">✨ Gerencie informações das suas clientes</p>
          </div>
          <Button
            onClick={() => abrirModal()}
            variant="primary"
            className="shadow-elegant hover:scale-105 transition-transform"
          >
            👤 Nova Cliente
          </Button>
        </div>

        {/* Busca */}
        {clientes.length > 0 && (
          <div className="card-elegant p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🔍 Buscar Clientes
            </h2>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome, email ou telefone..."
              className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
            {busca && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💫 Mostrando {clientesFiltrados.length} de {clientes.length} clientes
                </p>
                <button
                  onClick={() => setBusca('')}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Limpar busca
                </button>
              </div>
            )}
          </div>
        )}

        {clientes.length === 0 ? (
          <div className="card-elegant p-12 text-center">
            <div className="text-6xl mb-6">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma cliente cadastrada
            </h3>
            <p className="text-gray-600 mb-8">
              ✨ Comece adicionando informações das suas clientes
            </p>
            <Button
              onClick={() => abrirModal()}
              variant="primary"
              className="shadow-elegant hover:scale-105 transition-transform"
            >
              👤 Adicionar Primeira Cliente
            </Button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="card-elegant p-12 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma cliente encontrada
            </h3>
            <p className="text-gray-600 mb-8">
              Tente ajustar os termos de busca ou limpar para ver todas as clientes
            </p>
            <button
              onClick={() => setBusca('')}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Limpar Busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="card-interactive group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {cliente.nome}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => abrirModal(cliente)}
                      className="text-primary-600 hover:text-primary-800 hover:scale-110 transition-all p-1"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => excluirCliente(cliente.id)}
                      className="text-red-500 hover:text-red-700 hover:scale-110 transition-all p-1"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {cliente.email && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="text-secondary-500 mr-2">📧</span>
                      {cliente.email}
                    </p>
                  )}
                  {cliente.telefone && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="text-secondary-500 mr-2">📱</span>
                      {cliente.telefone}
                    </p>
                  )}
                  {cliente.data_nascimento && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="text-secondary-500 mr-2">🎂</span>
                      {new Date(cliente.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {cliente.observacoes && (
                    <p className="text-sm text-gray-600 mt-3 italic bg-gray-50 p-2 rounded-lg">
                      {cliente.observacoes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {modalAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-elegant max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {clienteEditando ? '✏️ Editar Cliente' : '👤 Nova Cliente'}
                </h2>
                <button
                  onClick={fecharModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl hover:scale-110 transition-all"
                >
                  ×
                </button>
              </div>

              <form onSubmit={salvarCliente} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Nome da cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎂 Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Anotações sobre a cliente..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={fecharModal}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 shadow-elegant hover:scale-105 transition-transform"
                  >
                    {clienteEditando ? '✏️ Atualizar' : '💾 Salvar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientesPage 