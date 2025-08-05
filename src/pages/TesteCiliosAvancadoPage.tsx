import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { getEstilosCilios } from '../services/aiService'

const TesteCiliosAvancadoPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagemTeste, setImagemTeste] = useState<string | null>(null)
  const [arquivoTeste, setArquivoTeste] = useState<File | null>(null)
  const [testesExecutados, setTestesExecutados] = useState<any[]>([])
  const [testando, setTestando] = useState(false)

  const estilosCilios = getEstilosCilios()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setArquivoTeste(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagemTeste(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const executarTestesCompletos = async () => {
    if (!arquivoTeste) {
      alert('Por favor, selecione uma imagem primeiro')
      return
    }

    setTestando(true)
    setTestesExecutados([])

    try {
      // Importa as funções de teste dinamicamente
      const { 
        debugEyelashApplication, 
        testCurvedEyelashApplication,
        testEyelashAlignment 
      } = await import('../services/aiService')

      const resultados: any[] = []

      // 1. Teste de carregamento básico
      console.log('🔧 1. Testando carregamento básico...')
      try {
        const debugResult = await debugEyelashApplication(arquivoTeste, 'brasileiro-boneca')
        resultados.push({
          teste: 'Carregamento Básico',
          sucesso: debugResult.success,
          detalhes: debugResult.logs.join('\n'),
          imagem: debugResult.imageResult,
          icon: '🔧'
        })
      } catch (error) {
        resultados.push({
          teste: 'Carregamento Básico',
          sucesso: false,
          detalhes: `Erro: ${error}`,
          icon: '❌'
        })
      }

      // 2. Teste de curvatura avançada
      console.log('🌊 2. Testando curvatura avançada...')
      try {
        const curveResult = await testCurvedEyelashApplication(arquivoTeste, 'fox-eyes')
        resultados.push({
          teste: 'Curvatura Avançada',
          sucesso: curveResult.alignment !== 'poor',
          detalhes: `
Método: ${curveResult.landmarks.method}
Alinhamento: ${curveResult.alignment}
Qualidade da Curva: ${curveResult.curveQuality}%
Precisão Anatômica: ${curveResult.anatomicalAccuracy}%
Feedback: ${curveResult.feedback.join(', ')}
          `,
          imagem: curveResult.preview,
          qualidade: curveResult.curveQuality,
          icon: '🌊'
        })
      } catch (error) {
        resultados.push({
          teste: 'Curvatura Avançada',
          sucesso: false,
          detalhes: `Erro: ${error}`,
          icon: '❌'
        })
      }

      // 3. Teste de alinhamento
      console.log('🎯 3. Testando alinhamento dos cílios...')
      try {
        const alignResult = await testEyelashAlignment(arquivoTeste)
        resultados.push({
          teste: 'Alinhamento de Cílios',
          sucesso: alignResult.alignment !== 'poor',
          detalhes: `
Alinhamento: ${alignResult.alignment}
Score de Validação: ${alignResult.validationScore}%
Largura Olho Esquerdo: ${alignResult.eyeMetrics.leftEyeWidth}px
Largura Olho Direito: ${alignResult.eyeMetrics.rightEyeWidth}px
Simetria: ${alignResult.eyeMetrics.symmetryRatio}
Feedback: ${alignResult.feedback?.join(', ') || 'Nenhum'}
          `,
          qualidade: alignResult.validationScore,
          icon: '🎯'
        })
      } catch (error) {
        resultados.push({
          teste: 'Alinhamento de Cílios',
          sucesso: false,
          detalhes: `Erro: ${error}`,
          icon: '❌'
        })
      }

      setTestesExecutados(resultados)

    } catch (error) {
      console.error('Erro ao executar testes:', error)
      alert('Erro ao executar testes. Veja o console para detalhes.')
    } finally {
      setTestando(false)
    }
  }

  const testarEstiloEspecifico = async (estiloId: string) => {
    if (!arquivoTeste) {
      alert('Por favor, selecione uma imagem primeiro')
      return
    }

    setTestando(true)

    try {
      const { applyLashes } = await import('../services/aiService')
      
      const resultado = await applyLashes(arquivoTeste, estiloId, (progress) => {
        console.log(`Progresso ${estiloId}: ${progress}%`)
      })

      const novoTeste = {
        teste: `Estilo: ${estilosCilios.find(e => e.id === estiloId)?.nome}`,
        sucesso: resultado.status === 'concluido',
        detalhes: `
Tempo: ${resultado.tempoProcessamento}ms
Status: ${resultado.status}
${resultado.erro ? `Erro: ${resultado.erro}` : ''}
${resultado.metadata ? `Qualidade: ${resultado.metadata.qualidade}%` : ''}
        `,
        imagem: resultado.imagemProcessada,
        qualidade: resultado.metadata?.qualidade || 0,
        icon: '🎨'
      }

      setTestesExecutados(prev => [...prev, novoTeste])

    } catch (error) {
      console.error('Erro ao testar estilo:', error)
      const novoTeste = {
        teste: `Estilo: ${estilosCilios.find(e => e.id === estiloId)?.nome}`,
        sucesso: false,
        detalhes: `Erro: ${error}`,
        icon: '❌'
      }
      setTestesExecutados(prev => [...prev, novoTeste])
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-elegant border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                className="mr-4"
              >
                ← Voltar
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                🧪 Teste Avançado de Cílios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sistema com MediaPipe + Spline</span>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🔬</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Seção de Upload */}
        <div className="mb-8">
          <div className="card-elegant p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              📸 Imagem para Teste
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Upload */}
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 rounded-2xl p-6 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
                >
                  {imagemTeste ? (
                    <div>
                      <img
                        src={imagemTeste}
                        alt="Imagem de teste"
                        className="max-h-32 mx-auto rounded-lg shadow-lg"
                      />
                      <p className="text-sm text-gray-600 mt-2">Clique para alterar</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl mb-3">🧪</div>
                      <p className="font-medium">Selecione uma imagem para teste</p>
                      <p className="text-sm text-gray-600">JPG ou PNG (Max: 10MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Controles */}
              <div className="space-y-4">
                <Button
                  onClick={executarTestesCompletos}
                  disabled={!arquivoTeste || testando}
                  variant="primary"
                  className="w-full py-3 shadow-elegant"
                >
                  {testando ? '🔄 Executando Testes...' : '🚀 Executar Testes Completos'}
                </Button>

                <div className="text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">📋 Testes Incluídos:</h3>
                  <ul className="space-y-1">
                    <li>🔧 Carregamento básico dos overlays</li>
                    <li>🌊 Curvatura avançada com spline</li>
                    <li>🎯 Alinhamento e posicionamento</li>
                    <li>📊 Métricas de qualidade</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testes Rápidos por Estilo */}
        <div className="mb-8">
          <div className="card-elegant p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🎨 Teste Rápido por Estilo
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {estilosCilios.slice(0, 6).map((estilo) => (
                <button
                  key={estilo.id}
                  onClick={() => testarEstiloEspecifico(estilo.id)}
                  disabled={!arquivoTeste || testando}
                  className="p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  <div className="w-12 h-8 mx-auto mb-2 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={estilo.overlayPath}
                      alt={estilo.nome}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs font-medium">{estilo.nome.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados dos Testes */}
        {testesExecutados.length > 0 && (
          <div className="card-elegant p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Resultados dos Testes
            </h2>
            <div className="space-y-4">
              {testesExecutados.map((teste, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    teste.sucesso 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <span className="text-xl">{teste.icon}</span>
                        {teste.teste}
                        {teste.qualidade && (
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {teste.qualidade}% qualidade
                          </span>
                        )}
                      </h3>
                      <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap bg-white/50 p-2 rounded">
                        {teste.detalhes}
                      </pre>
                    </div>
                    {teste.imagem && (
                      <div className="ml-4">
                        <img
                          src={teste.imagem}
                          alt="Resultado do teste"
                          className="w-32 h-24 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default TesteCiliosAvancadoPage 