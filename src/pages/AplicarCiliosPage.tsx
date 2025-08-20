import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstilosCilios, downloadProcessedImage, type ProcessamentoIA } from '../services/aiService'
import { imagensService } from '../services/imagensService'

import { useAuthContext } from '../hooks/useAuthContext'
import { authClient } from '../lib/authClient'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'

const AplicarCiliosPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagemOriginal, setImagemOriginal] = useState<string | null>(null)
  const [arquivoOriginal, setArquivoOriginal] = useState<File | null>(null)
  const [estiloSelecionado, setEstiloSelecionado] = useState<string>('')
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ProcessamentoIA | null>(null)
  const [erro, setErro] = useState<string>('')
  const [salvandoImagem, setSalvandoImagem] = useState(false)

  
  const estilosCilios = getEstilosCilios()

  // Configurações removidas pois não há mais salvamento automático

  // Função removida para evitar salvamento duplicado

  // Logs de debug removidos para produção

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validações básicas
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        setErro('Formato inválido. Use apenas JPEG ou PNG.')
        return
      }
      
      if (file.size > maxSize) {
        setErro('Arquivo muito grande. Máximo de 10MB.')
        return
      }

      // Salvar arquivo e preview
      setArquivoOriginal(file)
      setErro('')
      setResultado(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagemOriginal(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Arquivo carregado com sucesso
    }
  }

  const handleEstiloClick = useCallback((estiloId: string) => {
    setEstiloSelecionado(estiloId)
    
    if (resultado) {
      setResultado(null)
    }
  }, [estiloSelecionado, resultado])

  const handleAplicarCilios = async () => {
    if (!arquivoOriginal || !estiloSelecionado) {
      setErro('Por favor, selecione uma imagem e um estilo de cílio')
      return
    }

    setProcessando(true)
    setProgresso(0)
    setErro('')
    setResultado(null)

    const formData = new FormData()
    formData.append('file', arquivoOriginal)
    formData.append('cilios_name', estiloSelecionado.replace(/-/g, '_'))

    try {
      const response = await fetch('https://dsv.zironite.uk/apply', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const blob = await response.blob()

      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64data = reader.result as string
        const resultadoProcessamento = {
          imagemOriginal: imagemOriginal!, // se estiver garantido
          estiloSelecionado,
          imagemProcessada: base64data,
          status: 'concluido' as const,
          // tempoProcessamento: undefined, // pode omitir
          // metadata: undefined,           // pode omitir
        }
        setResultado(resultadoProcessamento)
      }
      reader.readAsDataURL(blob)

    } catch (error: any) {
      // Erro no processamento
      setErro(error.message || 'Erro interno. Tente novamente.')
      setResultado({
        imagemOriginal: imagemOriginal!,
        estiloSelecionado,
        status: 'erro',
        erro: error.message || 'Erro interno',
      })
    } finally {
      setProcessando(false)
      setProgresso(0)
    }
  }



  const handleDownload = () => {
    if (resultado?.imagemProcessada) {
      const estilo = estilosCilios.find(e => e.id === estiloSelecionado)
      const nomeArquivo = `cilios-${estilo?.nome.toLowerCase().replace(/\s+/g, '-') || 'aplicados'}`
      downloadProcessedImage(resultado.imagemProcessada, nomeArquivo)
    }
  }

  const handleTryAgain = () => {
    setResultado(null)
    setErro('')
    setProgresso(0)
  }

  // Função para salvar imagem na galeria online (Supabase)
  const handleSalvarImagem = async () => {
    if (!resultado?.imagemProcessada || !user?.id) {
      toast.error('Erro: Imagem ou usuário não encontrado')
      return
    }

    setSalvandoImagem(true)
    
    try {
      // Verificar autenticação antes de salvar
      const isAuth = await authClient.isAuthenticated()
      if (!isAuth) {
        toast.error('Sessão expirada. Faça login novamente.')
        setSalvandoImagem(false)
        navigate('/login')
        return
      }

      // Converter base64 para File
      const response = await fetch(resultado.imagemProcessada)
      const blob = await response.blob()
      
      const estilo = estilosCilios.find(e => e.id === estiloSelecionado)
      const nomeArquivo = `cilios-${estilo?.nome.toLowerCase().replace(/\s+/g, '-') || 'aplicados'}-${Date.now()}.jpg`
      
      const file = new File([blob], nomeArquivo, { type: 'image/jpeg' })
      
      // Salvar no Supabase Storage
      try {
        console.log('[AplicarCilios] Iniciando upload da imagem processada');
        const uploadResult = await imagensService.uploadToStorage(file, user.id);
        
        console.log('[AplicarCilios] Upload concluído, salvando metadados:', {
          url: uploadResult.publicUrl,
          metadata: uploadResult.metadata
        });
        
        // Gerar um UUID válido para cliente_id (cliente padrão)
        const clienteId = '00000000-0000-0000-0000-000000000000'; // UUID nulo padrão
        
        // Salvar metadados na tabela imagens_clientes
        const imagemData = {
          cliente_id: clienteId,
          user_id: user.id,
          nome: uploadResult.metadata.original_name,
          url: uploadResult.publicUrl,
          tipo: 'depois' as 'antes' | 'depois' | 'processo',
          descricao: `Imagem processada com estilo ${estilo?.nome || 'aplicado'} - Salva manualmente`,
          filename: uploadResult.metadata.filename,
          original_name: uploadResult.metadata.original_name,
          file_size: uploadResult.metadata.file_size,
          mime_type: uploadResult.metadata.mime_type,
          width: uploadResult.metadata.width,
          height: uploadResult.metadata.height,
          storage_path: uploadResult.metadata.storage_path,
          processing_status: 'completed' as 'pending' | 'processing' | 'completed' | 'failed'
        };
        
        await imagensService.criar(imagemData);
        
        console.log('[AplicarCilios] Imagem salva com sucesso no Supabase Storage');
        toast.success('✅ Imagem salva na galeria!');
        
        // Redirecionamento automático após salvamento
        toast.success('✅ Imagem salva com sucesso!')
        setTimeout(() => {
          navigate('/minhas-imagens')
        }, 1500)
        
      } catch (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
        toast.error('⚠️ Erro ao salvar na galeria')
      } finally {
        setSalvandoImagem(false)
      }
      
    } catch (error) {
      console.error('❌ [handleSalvarImagem] Erro crítico:', error)
      setSalvandoImagem(false)
      
      // Verificar se é erro de autenticação
      if (error instanceof Error) {
        if (error.message.includes('autenticação') || error.message.includes('login')) {
          toast.error('🔒 Sessão expirada - redirecionando para login...')
          setTimeout(() => navigate('/login'), 2000)
        } else if (error.message.includes('rede') || error.message.includes('connection')) {
          toast.error('🌐 Erro de conexão - verifique sua internet')
        } else if (error.message.includes('servidor')) {
          toast.error('🖥️ Erro no servidor - tente novamente em alguns momentos')
        } else {
          toast.error(`❌ ${error.message}`)
        }
      } else {
        toast.error('❌ Erro inesperado ao salvar imagem')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-elegant border-b border-primary-100">
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                ✨ Aplicar Cílios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">CíliosClick</span>
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">💄</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens de Erro */}
        {erro && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-2xl shadow-sm">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <p className="text-red-700 font-medium">{erro}</p>
            </div>
          </div>
        )}



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda - Upload e Controles */}
          <div className="space-y-6">
            {/* Upload de Imagem */}
            <div className="card-elegant p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📸 1. Selecione a Imagem
              </h2>
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary-300 rounded-2xl p-8 text-center hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                >
                  {imagemOriginal ? (
                    <div className="space-y-4">
                      <img
                        src={imagemOriginal}
                        alt="Imagem selecionada"
                        className="max-h-48 mx-auto rounded-2xl shadow-lg group-hover:scale-105 transition-transform"
                      />
                      <p className="text-sm text-gray-600">✨ Clique para alterar a imagem</p>
                      {arquivoOriginal && (
                        <div className="text-xs text-gray-500 bg-white/80 p-2 rounded-xl">
                          <p className="font-medium">{arquivoOriginal.name}</p>
                          <p>{(arquivoOriginal.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-6xl">📸</div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Faça upload da foto</p>
                        <p className="text-sm text-gray-600">Clique aqui ou arraste uma imagem</p>
                        <p className="text-xs text-gray-500 mt-2">Formatos: JPEG, PNG (Max: 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Seletor de Estilo */}
            <div className="card-elegant p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                💄 2. Escolha o Estilo
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {estilosCilios.length > 0 ? (
                  estilosCilios.map((estilo) => (
                    <button
                      key={estilo.id}
                      onClick={() => {
                        handleEstiloClick(estilo.id)
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 group relative overflow-hidden ${
                        estiloSelecionado === estilo.id
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 ring-2 ring-primary-200 shadow-lg'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      {/* 🖼️ PREVIEW REAL DO PNG */}
                      <div className="w-16 h-12 mx-auto mb-3 relative bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg overflow-hidden shadow-inner">
                        <img
                          src={estilo.overlayPath}
                          alt={`Preview ${estilo.nome}`}
                          className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform"
                          onLoad={() => {}}
                          onError={(e) => {
                            // Fallback para emoji se o PNG não carregar
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        {/* Fallback emoji (oculto por padrão) */}
                        <div className="hidden absolute inset-0 flex items-center justify-center text-2xl">
                          {estilo.thumbnail}
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-900 leading-tight">{estilo.nome}</div>
                      <div className="text-xs text-gray-600 mt-1">{estilo.descricao}</div>
                      
                      {estiloSelecionado === estilo.id && (
                        <div className="mt-3 text-xs text-primary-600 font-medium bg-primary-100 px-2 py-1 rounded-lg">
                          ✓ Selecionado
                        </div>
                      )}
                      
                      {/* 💫 Efeito brilho para indicar qualidade */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-3 p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">⏳</div>
                    <p>Carregando estilos...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botão Aplicar */}
            <div className="card-elegant p-6">
              <Button
                onClick={handleAplicarCilios}
                disabled={!arquivoOriginal || !estiloSelecionado || processando}
                variant={!arquivoOriginal || !estiloSelecionado || processando ? "secondary" : "primary"}
                className={`w-full py-4 text-lg shadow-elegant ${
                  !arquivoOriginal || !estiloSelecionado || processando
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 transition-transform'
                }`}
              >
                {processando ? '🔄 Processando com IA...' : '✨ Aplicar Cílios'}
              </Button>

              {/* Barra de Progresso */}
              {processando && (
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${progresso}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 text-center font-medium">
                    ✨ {progresso}% concluído
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita - Resultado */}
          <div className="space-y-6">
            <div className="card-elegant p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                🎭 3. Resultado
              </h2>
              
              {/* Estado Inicial */}
              {!imagemOriginal && !resultado && (
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">👁️</div>
                    <p className="font-medium">O resultado aparecerá aqui</p>
                    <p className="text-sm mt-2">Selecione uma imagem para começar</p>
                  </div>
                </div>
              )}

              {/* Aguardando Processamento */}
              {imagemOriginal && !resultado && !processando && (
                <div className="aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary-300">
                  <div className="text-center text-gray-600">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="font-medium">Clique em "Aplicar Cílios" para ver o resultado</p>
                    {estiloSelecionado && (
                      <p className="text-sm mt-3 text-primary-600 bg-white px-3 py-1 rounded-lg">
                        Estilo: {estilosCilios.find(e => e.id === estiloSelecionado)?.nome}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Processando */}
              {processando && (
                <div className="aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="text-6xl mb-4 animate-spin">🔄</div>
                    <p className="font-medium">Processando com IA...</p>
                    <div className="mt-6 w-64 bg-white rounded-full h-3 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progresso}%` }}
                      ></div>
                    </div>
                    <p className="mt-3 text-sm font-medium">✨ {progresso}% concluído</p>
                  </div>
                </div>
              )}

              {/* Resultado Concluído */}
              {resultado && resultado.status === 'concluido' && (
                <div className="space-y-6">
                  <div className="relative group">
                    {resultado.imagemProcessada ? (
                      <img
                        src={resultado.imagemProcessada}
                        alt="Resultado com cílios aplicados"
                        className="w-full rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow"
                        onLoad={() => {}}
                        onError={() => {}}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl flex items-center justify-center border border-yellow-200">
                        <div className="text-center text-yellow-700">
                          <div className="text-4xl mb-2">⚠️</div>
                          <p className="font-medium">Resultado sem imagem</p>
                          <p className="text-sm">Usando imagem original</p>
                          <img
                            src={imagemOriginal || ''}
                            alt="Imagem original"
                            className="mt-4 max-w-full rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                  
                  {/* Informações Simplificadas */}
                  <div className="text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl">
                    <p className="flex items-center mb-2">
                      <span className="text-primary-600 mr-2">💄</span>
                      <strong>Cílio escolhido:</strong> 
                      <span className="ml-2">{estilosCilios.find(e => e.id === estiloSelecionado)?.nome}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="text-secondary-600 mr-2">📅</span>
                      <strong>Data de geração:</strong> 
                      <span className="ml-2">{new Date().toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <Button 
                        onClick={handleDownload}
                        variant="primary"
                        className="flex-1 shadow-elegant hover:scale-105 transition-transform"
                      >
                        📥 Baixar Resultado
                      </Button>
                      <Button 
                        onClick={handleSalvarImagem}
                        variant="secondary"
                        disabled={salvandoImagem}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                      >
                        {salvandoImagem ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          '💾 Salvar Imagem'
                        )}
                      </Button>
                    </div>
                    <Button 
                      onClick={handleTryAgain}
                      variant="secondary"
                      className="w-full"
                    >
                      🔄 Tentar Outro Estilo
                    </Button>
                  </div>
                </div>
              )}

              {/* Resultado com Erro */}
              {resultado && resultado.status === 'erro' && (
                <div className="aspect-square bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center border border-red-200">
                  <div className="text-center text-red-600">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="font-medium text-lg">Erro no processamento</p>
                    <p className="text-sm mt-2 bg-white/80 p-3 rounded-lg">{resultado.erro}</p>
                    <Button 
                      onClick={handleTryAgain}
                      variant="primary"
                      className="mt-6 shadow-elegant hover:scale-105 transition-transform"
                    >
                      🔄 Tentar Novamente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AplicarCiliosPage