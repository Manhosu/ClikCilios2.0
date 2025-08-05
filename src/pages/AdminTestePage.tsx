import React, { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { TesteSistema } from '../utils/testeSistema'
import { Button } from '../components/Button'
import { testEyelashAlignment } from '../services/aiService'

interface ResultadoTeste {
  modulo: string
  teste: string
  sucesso: boolean
  erro?: string
  detalhes?: any
}

const AdminTestePage: React.FC = () => {
  const { isAdmin, loading } = useAdmin()
  const [executando, setExecutando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoTeste[]>([])
  const [relatorio, setRelatorio] = useState<string>('')
  const [testeAlinhamento, setTesteAlinhamento] = useState<any>(null)
  const [imagemTeste, setImagemTeste] = useState<File | null>(null)
  const [processandoTeste, setProcessandoTeste] = useState(false)
  const [estiloTeste, setEstiloTeste] = useState('volume-brasileiro-d')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  const executarTestes = async () => {
    setExecutando(true)
    setResultados([])
    setRelatorio('')

    try {
      console.log('🧪 Iniciando testes do sistema...')
      const resultadosTestes = await TesteSistema.executarTodosOsTestes()
      setResultados(resultadosTestes)
      
      const relatorioGerado = TesteSistema.gerarRelatorio()
      setRelatorio(relatorioGerado)
      
    } catch (error) {
      console.error('❌ Erro ao executar testes:', error)
    } finally {
      setExecutando(false)
    }
  }

  const executarFluxoCompleto = async () => {
    setExecutando(true)
    
    try {
      console.log('🎯 Executando teste de fluxo completo...')
      const sucesso = await TesteSistema.testeFluxoCompleto()
      
      if (sucesso) {
        alert('✅ Fluxo completo executado com sucesso!')
      } else {
        alert('❌ Falha no fluxo completo. Verifique o console.')
      }
    } catch (error) {
      console.error('❌ Erro no teste de fluxo:', error)
      alert('❌ Erro no teste de fluxo completo.')
    } finally {
      setExecutando(false)
    }
  }

  const baixarRelatorio = () => {
    const blob = new Blob([relatorio], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-testes-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (sucesso: boolean) => {
    return sucesso ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (sucesso: boolean) => {
    return sucesso ? '✅' : '❌'
  }

  const handleTesteAlinhamento = async () => {
    if (!imagemTeste) {
      setResultados(prev => [...prev, {
        modulo: 'Sistema',
        teste: 'Teste de Alinhamento',
        sucesso: false,
        erro: 'Nenhuma imagem selecionada'
      }])
      return
    }

    setProcessandoTeste(true)
    try {
      console.log('🧪 Iniciando teste de alinhamento...')
      
      const resultado = await testEyelashAlignment(imagemTeste)
      
      setTesteAlinhamento(resultado)
      setResultados(prev => [...prev, {
        modulo: 'IA',
        teste: 'Teste de Alinhamento',
        sucesso: true,
        detalhes: `Qualidade: ${resultado.alignment.toUpperCase()}`,
        dados: resultado
      }])
      
      console.log('✅ Teste de alinhamento concluído:', resultado)
      
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      setResultados(prev => [...prev, {
        modulo: 'IA',
        teste: 'Teste de Alinhamento',
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      }])
    } finally {
      setProcessandoTeste(false)
    }
  }



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Testes do Sistema CíliosClick
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de Controle */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Controles</h2>
              
              <div className="space-y-4">
                <Button
                  onClick={executarTestes}
                  isLoading={executando}
                  className="w-full"
                  variant="primary"
                >
                  {executando ? 'Executando...' : 'Executar Todos os Testes'}
                </Button>

                <Button
                  onClick={executarFluxoCompleto}
                  isLoading={executando}
                  className="w-full"
                  variant="secondary"
                >
                  Teste Fluxo Completo (E2E)
                </Button>

                {relatorio && (
                  <Button
                    onClick={baixarRelatorio}
                    className="w-full"
                    variant="secondary"
                  >
                    📁 Baixar Relatório
                  </Button>
                )}
              </div>

              {/* Resumo */}
              {resultados.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Resumo</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{resultados.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sucessos:</span>
                      <span className="font-medium text-green-600">
                        {resultados.filter(r => r.sucesso).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Falhas:</span>
                      <span className="font-medium text-red-600">
                        {resultados.filter(r => !r.sucesso).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Sucesso:</span>
                      <span className="font-medium">
                        {((resultados.filter(r => r.sucesso).length / resultados.length) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Console */}
              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-white mb-2">📝 Console</h3>
                <p className="text-gray-300 text-sm">
                  Abra o console do navegador (F12) para ver logs detalhados dos testes.
                </p>
              </div>
            </div>

            {/* Resultados */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Resultados dos Testes</h2>
              
              {resultados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🚀</div>
                  <p>Clique em "Executar Todos os Testes" para iniciar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar por módulo */}
                  {[...new Set(resultados.map(r => r.modulo))].map(modulo => {
                    const testesModulo = resultados.filter(r => r.modulo === modulo)
                    const sucessosModulo = testesModulo.filter(r => r.sucesso).length
                    
                    return (
                      <div key={modulo} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">
                          🔧 {modulo} ({sucessosModulo}/{testesModulo.length})
                        </h3>
                        
                        <div className="space-y-2">
                          {testesModulo.map((resultado, index) => (
                            <div 
                              key={index}
                              className="flex items-start justify-between p-3 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={getStatusColor(resultado.sucesso)}>
                                    {getStatusIcon(resultado.sucesso)}
                                  </span>
                                  <span className="font-medium">{resultado.teste}</span>
                                </div>
                                {(resultado.detalhes || resultado.erro) && (
                                  <div className="mt-1 text-sm text-gray-600">
                                    {resultado.detalhes || resultado.erro}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Checklist de Produção */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Checklist de Produção</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🔐 Autenticação</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Registro de usuário</li>
                  <li>✅ Login/logout</li>
                  <li>✅ Recuperação de senha</li>
                  <li>✅ Proteção de rotas</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">📷 Aplicação IA</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Upload de imagens</li>
                  <li>✅ 6 estilos de cílios</li>
                  <li>✅ Processamento (mock/real)</li>
                  <li>✅ Download de resultado</li>
                </ul>
              </div>

              <div className="p-4 bg-rosegold-50 rounded-lg">
                <h3 className="font-semibold text-rosegold-800 mb-2">🎫 Sistema Cupons</h3>
                <ul className="text-sm text-rosegold-700 space-y-1">
                  <li>✅ CRUD completo</li>
                  <li>✅ Rastreamento de uso</li>
                  <li>✅ Cálculo de comissões</li>
                  <li>✅ Relatórios detalhados</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">🔗 Hotmart</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>✅ Webhook seguro</li>
                  <li>✅ Criação de usuários</li>
                  <li>✅ Registro de cupons</li>
                  <li>✅ Validação HMAC</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">🛡️ Segurança</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>✅ RLS no Supabase</li>
                  <li>✅ Rotas protegidas</li>
                  <li>✅ Validação de dados</li>
                  <li>✅ Admin restrito</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">🚀 Deploy</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✅ Build sem erros</li>
                  <li>✅ Variáveis de ambiente</li>
                  <li>✅ Função serverless</li>
                  <li>✅ Documentação completa</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Seção de Teste de Alinhamento de Cílios */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              🎯 Teste de Alinhamento de Cílios (Refinado)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Imagem para Teste:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagemTeste(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Selector de Estilo para Teste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estilo de Cílio para Testar:
                </label>
                <select 
                  value={estiloTeste}
                  onChange={(e) => setEstiloTeste(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="volume-brasileiro-d">Volume Brasileiro D</option>
                  <option value="volume-fio-fio-d">Volume Fio a Fio D</option>
                  <option value="volume-russo-d">Volume Russo D</option>
                  <option value="volume-egipcio-3d">Volume Egípcio 3D</option>
                  <option value="boneca">Boneca</option>
                  <option value="fox-eyes">Fox Eyes</option>
                </select>
              </div>

              <Button
                onClick={handleTesteAlinhamento}
                disabled={!imagemTeste || processandoTeste}
                className="w-full"
              >
                {processandoTeste ? '🧪 Analisando Refinamentos...' : '🔍 Testar Alinhamento Refinado'}
              </Button>

              {/* Resultados do Teste de Alinhamento */}
              {testeAlinhamento && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">
                    📊 Análise de Refinamentos - Estilo: {estiloTeste}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Qualidade do Alinhamento:</strong>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        testeAlinhamento.alignment === 'excellent' 
                          ? 'bg-green-100 text-green-800'
                          : testeAlinhamento.alignment === 'good'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {testeAlinhamento.alignment.toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <strong>Score de Validação:</strong>
                      <span className="ml-2 text-blue-600 font-medium">
                        {testeAlinhamento.validationScore || 'N/A'}%
                      </span>
                    </div>
                    
                    <div>
                      <strong>Landmarks Detectados:</strong>
                      <span className="ml-2 text-gray-600">
                        {testeAlinhamento.landmarks ? 'Sim ✅' : 'Não ❌'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>Métricas do Olho:</strong>
                      <span className="ml-2 text-gray-600">
                        {testeAlinhamento.eyeMetrics ? 'Calculadas ✅' : 'Erro ❌'}
                      </span>
                    </div>
                  </div>

                  {/* Configurações Específicas do Estilo */}
                  {testeAlinhamento.styleConfig && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">
                        🎨 Configurações do Estilo "{estiloTeste}":
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        <div>Offset Anatômico: {(testeAlinhamento.styleConfig.anatomicalOffsetRatio * 100).toFixed(0)}%</div>
                        <div>Projeção Máxima: {(testeAlinhamento.styleConfig.maxProjectionRatio * 100).toFixed(0)}%</div>
                        <div>Opacidade: {(testeAlinhamento.styleConfig.blendOpacity * 100).toFixed(0)}%</div>
                        <div>Curvatura: {(testeAlinhamento.styleConfig.curvatureIntensity * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  )}

                  {/* Feedback de Ajustes */}
                  {testeAlinhamento.feedback && testeAlinhamento.feedback.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-2">
                        ⚠️ Ajustes Aplicados:
                      </h5>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {testeAlinhamento.feedback.map((feedback: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            {feedback}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTestePage