import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstilosCilios, downloadProcessedImage, isNewFormat, prepareAPIPayload, type ProcessamentoIA } from '../services/aiService'
import { imagensService } from '../services/imagensService'
import { cacheService } from '../services/cacheService'
import { useAuthContext } from '../hooks/useAuthContext'
import { authClient } from '../lib/authClient'
import Button from '../components/Button'
import { toast } from 'react-hot-toast'
import { EstiloCilio } from '../services/aiService'

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

  // 🆕 ESTADOS PARA EXPAND/COLLAPSE - INICIALIZAÇÃO SIMPLES
  const [secaoExpandida, setSecaoExpandida] = useState<Record<string, boolean>>(() => ({
    'estilos-antigos': true,
    'classico': true,
    'brasileiro': true,
    'egipcio': true,
    'fox-eyes': true,
    'hibrido': true,
    'mega': true
  }))

  const estilosCilios = getEstilosCilios()

  // 🔄 ESTILOS ANTIGOS (formato estático - cilios_name)
  const estilosAntigos = useMemo(() => {
    return estilosCilios.filter(estilo => !isNewFormat(estilo))
  }, [estilosCilios])

  // 🆕 ESTILOS NOVOS (formato dinâmico - campos separados)
  const estilosNovos = useMemo(() => {
    return estilosCilios.filter(estilo => isNewFormat(estilo))
  }, [estilosCilios])

  // 🆕 ESTRUTURA HIERÁRQUICA: Tipo > Variante > Tamanhos/Curvaturas
  const estilosHierarquicos = useMemo(() => {
    const hierarquia: Record<string, Record<string, EstiloCilio[]>> = {}
    
    estilosNovos.forEach(estilo => {
      const tipo = estilo.estilo_base! // Classico, Brasileiro, etc.
      const variante = estilo.mapping! // Boneca, Gatinho, Esquilo, etc.
      
      if (!hierarquia[tipo]) {
        hierarquia[tipo] = {}
      }
      
      if (!hierarquia[tipo][variante]) {
        hierarquia[tipo][variante] = []
      }
      
      hierarquia[tipo][variante].push(estilo)
    })
    
    return hierarquia
  }, [estilosNovos])

  // 🎨 ÍCONES POR TIPO
  const iconesTypes = {
    'Classico': '✨',
    'Brasileiro': '🇧🇷',
    'Egipcio': '🏺',
    'Fox Eyes': '🦊',
    'Hibrido': '🎭',
    'Mega': '💥'
  }

  // 🎨 ÍCONES POR VARIANTE
  const iconesVariantes = {
    'Boneca': '👶',
    'Gatinho': '😸',
    'Esquilo': '🐿️',
    'Fox Eyes': '🦊'
  }

  // 🆕 FUNÇÃO SIMPLES PARA TOGGLE EXPAND/COLLAPSE
  const toggleSecao = useCallback((secaoId: string) => {
    setSecaoExpandida(prev => ({
      ...prev,
      [secaoId]: !prev[secaoId]
    }))
  }, [])

  // 🎭 COMPONENTE DE SLIDE-DOWN PERFEITO
  const SlideDownContent = ({ isOpen, children, className = '' }: { 
    isOpen: boolean
    children: React.ReactNode 
    className?: string
  }) => (
    <div 
      className={`overflow-hidden transition-all duration-400 ease-in-out ${
        isOpen 
          ? 'max-h-screen opacity-100' 
          : 'max-h-0 opacity-0'
      } ${className}`}
    >
      <div className={`transition-all duration-400 ease-in-out ${
        isOpen 
          ? 'transform translate-y-0' 
          : 'transform -translate-y-4'
      }`}>
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  )

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      const maxSize = 100 * 1024 * 1024 // 100MB
      
      if (!validTypes.includes(file.type)) {
        setErro('Formato inválido. Use apenas JPEG ou PNG.')
        return
      }
      
      if (file.size > maxSize) {
        setErro('Arquivo muito grande. Máximo de 100MB.')
        return
      }

      setArquivoOriginal(file)
      setErro('')
      setResultado(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagemOriginal(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEstiloClick = useCallback((estiloId: string) => {
    setEstiloSelecionado(estiloId)
    
    if (resultado) {
      setResultado(null)
    }
  }, [resultado])

  const handleAplicarCilios = async () => {
    if (!arquivoOriginal || !estiloSelecionado) {
      setErro('Por favor, selecione uma imagem e um estilo de cílio')
      return
    }

    setProcessando(true)
    setProgresso(0)
    setErro('')
    setResultado(null)

    const estilo = estilosCilios.find(e => e.id === estiloSelecionado)
    
    if (!estilo) {
      setErro('Estilo não encontrado')
      setProcessando(false)
      return
    }

    const formData = prepareAPIPayload(estilo, arquivoOriginal)

    // 📊 LOG DE DEBUG
    if (isNewFormat(estilo)) {
      console.log('📤 Enviando para API (NOVO formato):', {
        estilo_base: estilo.estilo_base,
        mapping: estilo.mapping,
        tamanho: estilo.tamanho,
        curvatura: estilo.curvatura,
        backend_monta: `${estilo.estilo_base}_${estilo.mapping}_${estilo.tamanho}_${estilo.curvatura}`
      })
    } else {
      console.log('📤 Enviando para API (formato ANTIGO):', {
        cilios_name: estilo.codigo.replace(/-/g, '_'),
        formato: 'legacy'
      })
    }

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
          imagemOriginal: imagemOriginal!,
          estiloSelecionado,
          imagemProcessada: base64data,
          status: 'concluido' as const,
        }
        setResultado(resultadoProcessamento)
      }
      reader.readAsDataURL(blob)

    } catch (error: any) {
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
      const isAuth = await authClient.isAuthenticated()
      if (!isAuth) {
        toast.error('Sessão expirada. Faça login novamente.')
        setSalvandoImagem(false)
        navigate('/login')
        return
      }

      const response = await fetch(resultado.imagemProcessada)
      const blob = await response.blob()
      
      const estilo = estilosCilios.find(e => e.id === estiloSelecionado)
      const nomeArquivo = `cilios-${estilo?.nome.toLowerCase().replace(/\s+/g, '-') || 'aplicados'}-${Date.now()}.jpg`
      
      const file = new File([blob], nomeArquivo, { type: 'image/jpeg' })
      
      try {
        console.log('[AplicarCilios] Iniciando upload da imagem processada');
        const uploadResult = await imagensService.uploadToStorage(file, user.id);
        
        console.log('[AplicarCilios] Upload concluído, salvando metadados:', {
          url: uploadResult.publicUrl,
          metadata: uploadResult.metadata
        });
        
        const clienteId = '00000000-0000-0000-0000-000000000000';
        
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
        
        if (user?.id) {
          cacheService.invalidateImagesCache(user.id, 'created');
        }
        
        toast.success('✅ Imagem salva na galeria!');
        
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
                        <p className="text-xs text-gray-500 mt-2">Formatos: JPEG, PNG (Max: 100MB)</p>
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

            {/* 🆕 SELETOR DE ESTILO COM SLIDE-DOWN PERFEITO */}
            <div className="card-elegant p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                💄 2. Escolha o Estilo
              </h2>
              
              <div className="space-y-6">
                {/* 🔄 SEÇÃO ESTILOS ANTIGOS COM SLIDE-DOWN */}
                {estilosAntigos.length > 0 && (
                  <div className="space-y-0">
                    <button
                      onClick={() => toggleSecao('estilos-antigos')}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:shadow-md"
                    >
                      <h3 className="text-lg font-medium text-gray-800 flex items-center">
                        📋 <span className="ml-2">Estilos Legados</span>
                        <span className="ml-2 text-sm text-gray-500">({estilosAntigos.length} opções)</span>
                      </h3>
                      <div className={`text-gray-500 text-lg transition-all duration-400 ease-in-out transform ${
                        secaoExpandida['estilos-antigos'] ? 'rotate-90' : 'rotate-0'
                      }`}>
                        ▶
                      </div>
                    </button>

                    <SlideDownContent isOpen={secaoExpandida['estilos-antigos']}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {estilosAntigos.map((estilo) => (
                          <button
                            key={estilo.id}
                            onClick={() => handleEstiloClick(estilo.id)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 group relative overflow-hidden ${
                              estiloSelecionado === estilo.id
                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-secondary-50 ring-2 ring-primary-200 shadow-lg'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                            }`}
                          >
                            <div className="absolute top-2 left-2">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                📋 Legado
                              </span>
                            </div>

                            <div className="w-16 h-12 mx-auto mb-3 relative bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg overflow-hidden shadow-inner">
                              <img
                                src={estilo.overlayPath}
                                alt={`Preview ${estilo.nome}`}
                                className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
                              />
                            </div>
                            
                            <div className="text-sm font-medium text-gray-900 leading-tight">{estilo.nome}</div>
                            <div className="text-xs text-gray-600 mt-1">{estilo.descricao}</div>
                            
                            {estiloSelecionado === estilo.id && (
                              <div className="mt-3 text-xs text-primary-600 font-medium bg-primary-100 px-2 py-1 rounded-lg animate-pulse">
                                ✓ Selecionado
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </SlideDownContent>
                  </div>
                )}

                {/* 🆕 SEÇÕES HIERÁRQUICAS COM SLIDE-DOWN PERFEITO */}
                {Object.entries(estilosHierarquicos).map(([tipo, variantesPorTipo]) => (
                  <div key={tipo} className="space-y-0">
                    <button
                      onClick={() => toggleSecao(tipo.toLowerCase())}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:from-gray-100 hover:to-gray-150 transition-all duration-200 hover:shadow-md"
                    >
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="text-2xl mr-3">{iconesTypes[tipo as keyof typeof iconesTypes] || '💄'}</span>
                        <span>Cílios Volume {tipo}</span>
                        <span className="ml-3 text-sm text-gray-500 font-normal">
                          ({Object.values(variantesPorTipo).reduce((total, estilos) => total + estilos.length, 0)} opções)
                        </span>
                      </h3>
                      <div className={`text-gray-500 text-xl transition-all duration-400 ease-in-out transform ${
                        secaoExpandida[tipo.toLowerCase()] ? 'rotate-90' : 'rotate-0'
                      }`}>
                        ▶
                      </div>
                    </button>

                    <SlideDownContent isOpen={secaoExpandida[tipo.toLowerCase()]}>
                      <div className="space-y-6">
                        {Object.entries(variantesPorTipo).map(([variante, estilosVariante]) => (
                          <div key={`${tipo}-${variante}`} className="space-y-4">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl">
                              <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                                <span className="text-xl mr-2">{iconesVariantes[variante as keyof typeof iconesVariantes] || '💫'}</span>
                                <span>{tipo} {variante}</span>
                                <span className="ml-auto text-sm text-gray-500">({estilosVariante.length} variações)</span>
                              </h4>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                              {estilosVariante.map((estilo) => (
                                <button
                                  key={estilo.id}
                                  onClick={() => handleEstiloClick(estilo.id)}
                                  className={`aspect-square p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 group relative ${
                                    estiloSelecionado === estilo.id
                                      ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
                                      : 'border-gray-200 hover:border-primary-300'
                                  }`}
                                >
                                  <div className="absolute top-1 right-1">
                                    <span className="text-xs bg-green-100 text-green-600 px-1 py-0.5 rounded">
                                      ✨
                                    </span>
                                  </div>

                                  <div className="w-full h-2/3 flex items-center justify-center mb-2">
                                    <img
                                      src={estilo.overlayPath}
                                      alt={`${estilo.mapping} ${estilo.tamanho}${estilo.curvatura}`}
                                      className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-110"
                                    />
                                  </div>

                                  <div className="text-xs font-bold text-gray-700 text-center">
                                    {estilo.tamanho}{estilo.curvatura}
                                  </div>

                                  {estiloSelecionado === estilo.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center animate-bounce">
                                      <span className="text-xs text-white">✓</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </SlideDownContent>
                  </div>
                ))}

                {Object.keys(estilosHierarquicos).length === 0 && estilosAntigos.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4 animate-bounce">📦</div>
                    <p className="font-medium">Nenhum estilo encontrado</p>
                    <p className="text-sm mt-2">Adicione estilos no arquivo aiService.ts</p>
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
              
              {!imagemOriginal && !resultado && (
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">👁️</div>
                    <p className="font-medium">O resultado aparecerá aqui</p>
                    <p className="text-sm mt-2">Selecione uma imagem para começar</p>
                  </div>
                </div>
              )}

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

              {resultado && resultado.status === 'concluido' && (
                <div className="space-y-6">
                  <div className="relative group">
                    {resultado.imagemProcessada ? (
                      <img
                        src={resultado.imagemProcessada}
                        alt="Resultado com cílios aplicados"
                        className="w-full rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow"
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
