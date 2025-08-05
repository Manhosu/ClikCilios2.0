import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin'
import { CuponsService, type Cupom, type CupomFormData } from '../services/cuponsService'
import Button from '../components/Button'

const AdminCuponsPage = () => {
  const navigate = useNavigate()
  const { isAdmin, loading } = useAdmin()
  
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loadingCupons, setLoadingCupons] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  
  // Estados do formulário
  const [showForm, setShowForm] = useState(false)
  const [editingCupom, setEditingCupom] = useState<Cupom | null>(null)
  const [formData, setFormData] = useState<CupomFormData>({
    codigo: '',
    nome_parceira: '',
    email_parceira: '',
    comissao_percentual: 20
  })
  const [submitting, setSubmitting] = useState(false)

  // Verificar permissões
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard')
      return
    }
  }, [loading, isAdmin, navigate])

  // Carregar cupons
  const carregarCupons = async () => {
    setLoadingCupons(true)
    const { data, error } = await CuponsService.listarCupons()
    
    if (error) {
      setErro(error)
    } else {
      setCupons(data || [])
    }
    
    setLoadingCupons(false)
  }

  useEffect(() => {
    if (isAdmin) {
      carregarCupons()
    }
  }, [isAdmin])

  // Funções do formulário
  const resetForm = () => {
    setFormData({
      codigo: '',
      nome_parceira: '',
      email_parceira: '',
      comissao_percentual: 20
    })
    setEditingCupom(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErro('')
    setSucesso('')

    try {
      if (editingCupom) {
        // Atualizar cupom existente
        const { error } = await CuponsService.atualizarCupom(editingCupom.id, formData)
        if (error) {
          setErro(error)
        } else {
          setSucesso('✅ Cupom atualizado com sucesso!')
          resetForm()
          carregarCupons()
        }
      } else {
        // Criar novo cupom
        const { error } = await CuponsService.criarCupom(formData)
        if (error) {
          setErro(error)
        } else {
          setSucesso('✅ Cupom criado com sucesso!')
          resetForm()
          carregarCupons()
        }
      }
    } catch (error) {
      setErro('❌ Erro interno. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cupom: Cupom) => {
    setEditingCupom(cupom)
    setFormData({
      codigo: cupom.codigo,
      nome_parceira: cupom.nome_parceira,
      email_parceira: cupom.email_parceira,
      comissao_percentual: cupom.comissao_percentual
    })
    setShowForm(true)
  }

  const handleToggleAtivo = async (cupom: Cupom) => {
    const { error } = await CuponsService.toggleAtivoCupom(cupom.id)
    if (error) {
      setErro(error)
    } else {
      setSucesso(`✅ Cupom ${cupom.ativo ? 'desativado' : 'ativado'} com sucesso!`)
      carregarCupons()
    }
  }

  const handleDelete = async (cupom: Cupom) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${cupom.codigo}?`)) {
      return
    }

    const { error } = await CuponsService.excluirCupom(cupom.id)
    if (error) {
      setErro(error)
    } else {
      setSucesso('✅ Cupom excluído com sucesso!')
      carregarCupons()
    }
  }

  // Loading ou sem permissão
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-elegant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                🎫 Gerenciar Cupons
              </h1>
              <p className="text-gray-600 mt-2">✨ Sistema de cupons das parceiras</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => navigate('/admin/relatorio-cupons')}
                variant="secondary"
                className="hover:scale-105 transition-transform"
              >
                📊 Relatórios
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                disabled={showForm}
                variant="primary"
                className="shadow-elegant hover:scale-105 transition-transform"
              >
                ➕ Novo Cupom
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
              >
                ← Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {erro && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-2xl shadow-sm">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <p className="text-red-700 font-medium">{erro}</p>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-2xl shadow-sm">
            <div className="flex items-center">
              <span className="text-green-600 text-xl mr-3">✅</span>
              <p className="text-green-700 font-medium">{sucesso}</p>
            </div>
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <div className="card-elegant p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              {editingCupom ? '✏️ Editar Cupom' : '✨ Novo Cupom'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎫 Código do Cupom *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                    placeholder="Ex: LANA20"
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Nome da Parceira *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_parceira}
                    onChange={(e) => setFormData({...formData, nome_parceira: e.target.value})}
                    placeholder="Ex: Lana Silva"
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Email da Parceira *
                  </label>
                  <input
                    type="email"
                    value={formData.email_parceira}
                    onChange={(e) => setFormData({...formData, email_parceira: e.target.value})}
                    placeholder="lana@exemplo.com"
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Comissão (%)
                  </label>
                  <input
                    type="number"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData({...formData, comissao_percentual: parseFloat(e.target.value)})}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                  className="shadow-elegant hover:scale-105 transition-transform"
                >
                  {submitting ? '⏳ Salvando...' : (editingCupom ? '💾 Atualizar' : '✨ Criar Cupom')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cupons */}
        <div className="card-elegant shadow-2xl overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-primary-50 to-secondary-50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              🎫 Cupons Cadastrados ({cupons.length})
            </h2>
          </div>

          {loadingCupons ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔄</div>
              <p className="text-gray-600 text-lg">Carregando cupons...</p>
            </div>
          ) : cupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cupom cadastrado</h3>
              <p className="text-gray-600">Clique em "Novo Cupom" para criar o primeiro cupom</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🎫 Cupom
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      👤 Parceira
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📧 Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      💰 Comissão
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🔄 Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📅 Criado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cupons.map((cupom) => (
                    <tr key={cupom.id} className="hover:bg-gradient-to-r hover:from-primary-25 hover:to-secondary-25 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                          {cupom.codigo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{cupom.nome_parceira}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{cupom.email_parceira}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{cupom.comissao_percentual}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-xl ${
                          cupom.ativo 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {cupom.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(cupom.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleEdit(cupom)}
                            className="text-primary-600 hover:text-primary-800 hover:scale-110 transition-all p-1 rounded-lg"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleAtivo(cupom)}
                            className={`hover:scale-110 transition-all p-1 rounded-lg ${
                              cupom.ativo 
                                ? 'text-red-600 hover:text-red-800' 
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={cupom.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {cupom.ativo ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => handleDelete(cupom)}
                            className="text-red-600 hover:text-red-800 hover:scale-110 transition-all p-1 rounded-lg"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCuponsPage 