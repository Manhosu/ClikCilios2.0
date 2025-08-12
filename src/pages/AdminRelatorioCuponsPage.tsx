import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../hooks/useAdmin'
import { CuponsService, type Cupom, type UsoCupom, type UsoCupomFormData } from '../services/cuponsService'
import { Button } from '../components/Button'

interface RelatorioComissao {
  cupom: Cupom
  total_usos: number
  total_vendas: number
  total_comissoes: number
}

const AdminRelatorioCuponsPage = () => {
  const navigate = useNavigate()
  const { isAdmin, loading } = useAdmin()
  
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [usosCupons, setUsosCupons] = useState<UsoCupom[]>([])
  const [relatorioComissoes, setRelatorioComissoes] = useState<RelatorioComissao[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  
  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    cupom_id: '',
    origem: '',
    data_inicio: '',
    data_fim: ''
  })

  // Estados do formulário de registro manual
  const [showRegistroForm, setShowRegistroForm] = useState(false)
  const [registroData, setRegistroData] = useState<UsoCupomFormData>({
    cupom_id: '',
    email_cliente: '',
    valor_venda: 0,
    origem: 'manual',
    observacoes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Verificar permissões
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard')
      return
    }
  }, [loading, isAdmin, navigate])

  // Carregar dados
  const carregarDados = async () => {
    setLoadingData(true)
    setErro('')

    try {
      // Carregar cupons para o filtro
      const { data: cuponsData, error: cuponsError } = await CuponsService.listarCupons()
      if (cuponsError) {
        setErro(cuponsError)
        return
      }
      setCupons(cuponsData || [])

      // Carregar usos com filtros
      const { data: usosData, error: usosError } = await CuponsService.listarUsosCupons(filtros)
      if (usosError) {
        setErro(usosError)
        return
      }
      setUsosCupons(usosData || [])

      // Gerar relatório de comissões
      const { data: relatorioData, error: relatorioError } = await CuponsService.relatorioComissoes({
        data_inicio: filtros.data_inicio,
        data_fim: filtros.data_fim
      })
      if (relatorioError) {
        setErro(relatorioError)
        return
      }
      setRelatorioComissoes(relatorioData || [])

    } catch (error) {
      setErro('Erro interno ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      carregarDados()
    }
  }, [isAdmin, filtros])

  // Registrar uso manual
  const handleRegistroManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErro('')
    setSucesso('')

    try {
      const { error } = await CuponsService.registrarUsoCupom(registroData)
      if (error) {
        setErro(error)
      } else {
        setSucesso('Uso de cupom registrado com sucesso!')
        setShowRegistroForm(false)
        setRegistroData({
          cupom_id: '',
          email_cliente: '',
          valor_venda: 0,
          origem: 'manual',
          observacoes: ''
        })
        carregarDados()
      }
    } catch (error) {
      setErro('Erro interno. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading ou sem permissão
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatório de Cupons</h1>
              <p className="text-gray-600">Usos e comissões das parceiras</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowRegistroForm(true)}
                disabled={showRegistroForm}
              >
                ➕ Registrar Uso
              </Button>
              <Button
                onClick={() => navigate('/admin/cupons')}
                variant="secondary"
              >
                ⚙️ Gerenciar Cupons
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{sucesso}</p>
          </div>
        )}

        {/* Formulário de Registro Manual */}
        {showRegistroForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Registrar Uso de Cupom</h2>
            
            <form onSubmit={handleRegistroManual} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupom *
                  </label>
                  <select
                    value={registroData.cupom_id}
                    onChange={(e) => setRegistroData({...registroData, cupom_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Selecione um cupom</option>
                    {cupons.filter(c => c.ativo).map((cupom) => (
                      <option key={cupom.id} value={cupom.id}>
                        {cupom.codigo} - {cupom.parceira_nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email do Cliente *
                  </label>
                  <input
                    type="email"
                    value={registroData.email_cliente}
                    onChange={(e) => setRegistroData({...registroData, email_cliente: e.target.value})}
                    placeholder="cliente@exemplo.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Venda (R$)
                  </label>
                  <input
                    type="number"
                    value={registroData.valor_venda}
                    onChange={(e) => setRegistroData({...registroData, valor_venda: parseFloat(e.target.value)})}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origem
                  </label>
                  <select
                    value={registroData.origem}
                    onChange={(e) => setRegistroData({...registroData, origem: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="hotmart">Hotmart</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={registroData.observacoes}
                  onChange={(e) => setRegistroData({...registroData, observacoes: e.target.value})}
                  rows={3}
                  placeholder="Observações adicionais..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? '⏳ Registrando...' : '💾 Registrar'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowRegistroForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cupom
              </label>
              <select
                value={filtros.cupom_id}
                onChange={(e) => setFiltros({...filtros, cupom_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os cupons</option>
                {cupons.map((cupom) => (
                  <option key={cupom.id} value={cupom.id}>
                    {cupom.codigo} - {cupom.parceira_nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem
              </label>
              <select
                value={filtros.origem}
                onChange={(e) => setFiltros({...filtros, origem: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas as origens</option>
                <option value="manual">Manual</option>
                <option value="hotmart">Hotmart</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setFiltros({ cupom_id: '', origem: '', data_inicio: '', data_fim: '' })}
              variant="secondary"
            >
              🔄 Limpar Filtros
            </Button>
          </div>
        </div>

        {loadingData ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-2">🔄</div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Resumo de Comissões */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Resumo de Comissões por Cupom
                </h2>
              </div>

              {relatorioComissoes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">Nenhuma comissão encontrada no período</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cupom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parceira
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usos
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Vendas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Comissões
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % Comissão
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {relatorioComissoes.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{item.cupom.codigo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-gray-900">{item.cupom.parceira_nome}</div>
                              <div className="text-sm text-gray-600">{item.cupom.parceira_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-gray-900">{item.total_usos}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-gray-900 font-medium">
                              {formatCurrency(item.total_vendas)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-green-600 font-medium">
                              {formatCurrency(item.total_comissoes)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-gray-900">{item.cupom.percentual_comissao}%</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lista Detalhada de Usos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Histórico Detalhado ({usosCupons.length} registros)
                </h2>
              </div>

              {usosCupons.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-600">Nenhum uso de cupom encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cupom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Venda
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comissão
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Origem
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usosCupons.map((uso) => (
                        <tr key={uso.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(uso.data_uso)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {uso.cupom?.codigo}
                            </div>
                            <div className="text-sm text-gray-600">
                              {uso.cupom?.parceira_nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {uso.email_cliente}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {uso.valor_venda ? (
                              <span className="text-gray-900 font-medium">
                                {formatCurrency(uso.valor_venda)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {uso.comissao_calculada ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(uso.comissao_calculada)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              uso.origem === 'hotmart' 
                                ? 'bg-blue-100 text-blue-800'
                                : uso.origem === 'manual'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {uso.origem}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {uso.observacoes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminRelatorioCuponsPage