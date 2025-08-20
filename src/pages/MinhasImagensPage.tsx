import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
import { clientesService, Cliente } from '../services/clientesService'
import { imageApiService, ImagemCliente } from '../services/imageApiService'
import { cacheService } from '../services/cacheService'

import { toast } from 'react-hot-toast'

import Button from '../components/Button'
import ConfirmationCard from '../components/ConfirmationCard'

const MinhasImagensPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isLoading: userLoading } = useAuthContext()
  const [imagens, setImagens] = useState<ImagemCliente[]>([])
  // Removido: imagensLocais - usando apenas Supabase
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstilo, setFiltroEstilo] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [imagemSelecionada, setImagemSelecionada] = useState<ImagemCliente | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{ isOpen: boolean; imagemId: string | null }>({ isOpen: false, imagemId: null })
  // Removido: abaAtiva - usando apenas Supabase

  const estilos = [
    'Volume Fio a Fio D',
    'Volume Brasileiro D',
    'Volume Egípcio 3D D',
    'Volume Russo D',
    'Boneca',
    'Fox Eyes'
  ]

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      carregarDados()
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
      setImagens([])
      setClientes([])
    }
  }, [user, userLoading])

  // Event listeners otimizados com cache inteligente
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout
    
    const debouncedReload = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (user?.id && !loading) {
          // Verificar se realmente precisa recarregar (cache válido?)
          const cached = cacheService.getImagesList(user.id)
          const cacheAge = Date.now() - (((cached as any)?._timestamp) || 0)
          
          if (!cached || cacheAge > 3 * 60 * 1000) { // 3 minutos
            console.log('🔄 [MinhasImagens] Cache expirado - recarregando dados')
            carregarDados()
          } else {
            console.log('✅ [MinhasImagens] Cache ainda válido, não recarregando')
          }
        }
      }, 1500) // Debounce de 1.5 segundos
    }

    const handleStorageChange = (e: StorageEvent) => {
      // Apenas recarregar se for mudança relevante e não do próprio cache
      if ((e.key?.includes('ciliosclick') || e.key?.includes('image')) && 
          !e.key.includes('cache') && !e.key.includes('clik_') && user?.id) {
        console.log('🔄 [MinhasImagens] Storage alterado externamente')
        debouncedReload()
      }
    }

    const handleVisibilityChange = () => {
      // Recarregar apenas se a página ficou visível após muito tempo
      if (!document.hidden && user?.id && !loading) {
        const lastLoad = localStorage.getItem('last_image_load')
        const timeSinceLastLoad = Date.now() - (parseInt(lastLoad || '0'))
        
        if (timeSinceLastLoad > 10 * 60 * 1000) { // 10 minutos
          console.log('🔄 [MinhasImagens] Página visível após longo tempo - recarregando')
          debouncedReload()
        }
      }
    }

    // Listeners mais conservadores
    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(debounceTimer)
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, loading])

  // Atualização automática mais inteligente (apenas se necessário)
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      if (!document.hidden && !loading) {
        // Verificar se cache está muito antigo (mais de 5 minutos)
        const cached = cacheService.getImagesList(user.id)
        const cacheAge = Date.now() - (((cached as any)?._timestamp) || 0)
        
        if (!cached || cacheAge > 5 * 60 * 1000) {
          console.log('🔄 [MinhasImagens] Refresh automático - cache expirado')
          carregarDados()
        }
      }
    }, 30000) // 30 segundos (menos agressivo) para detectar novas imagens mais rapidamente

    return () => clearInterval(interval)
  }, [user?.id, loading])



  const carregarDados = useCallback(async () => {
    try {
      if (!user?.id) {
        setImagens([])
        setClientes([])
        setLoading(false)
        return
      }
      
      // Verificar cache primeiro
      const cachedImages = cacheService.getImagesList(user.id)
      const cachedClients = cacheService.getUserData(`clients_${user.id}`)
      
      // Se temos cache válido, usar primeiro (stale-while-revalidate)
      if (cachedImages && cachedClients && 
          Date.now() - ((cachedImages as any)._timestamp || 0) < 3 * 60 * 1000) {
        console.log('✅ [MinhasImagens] Usando dados do cache')
        setImagens(cachedImages.filter(img => img.id))
        setClientes(cachedClients)
        setLoading(false)
        return
      }
      
      setLoading(true)

      // Carregar imagens do Supabase Storage e clientes usando os serviços
      const [imagensData, clientesData] = await Promise.all([
        imageApiService.listar(), // Agora usa Storage diretamente
        clientesService.listar(user.id)
      ])

      setImagens(imagensData)
      setClientes(clientesData)
      
      // Salvar no cache com timestamp
      const imagesWithTimestamp = Object.assign(imagensData, { _timestamp: Date.now() })
      cacheService.setImagesList(user.id, imagesWithTimestamp, 5 * 60 * 1000)
      cacheService.setUserData(`clients_${user.id}`, clientesData, 10 * 60 * 1000)
      localStorage.setItem('last_image_load', Date.now().toString())
      
      console.log('📊 Dados carregados do Supabase Storage:', {
        totalImagens: imagensData.length,
        totalClientes: clientesData.length,
        processadas: imagensData.filter(img => img.tipo === 'depois').length,
        tiposUnicos: new Set(imagensData.map(img => img.tipo)).size
      })
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error)
      
      // Tentar usar cache em caso de erro
      if (user?.id) {
        const cachedImages = cacheService.getImagesList(user.id)
        const cachedClients = cacheService.getUserData(`clients_${user.id}`)
        
        if (cachedImages && cachedClients) {
          console.log('⚠️ [MinhasImagens] Usando cache devido a erro')
          setImagens(cachedImages.filter(img => img.id))
          setClientes(cachedClients)
        } else {
          setImagens([])
          setClientes([])
        }
      } else {
        setImagens([])
        setClientes([])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const abrirConfirmacaoExclusao = (id: string) => {
    setConfirmacaoExclusao({ isOpen: true, imagemId: id })
  }

  const fecharConfirmacaoExclusao = () => {
    setConfirmacaoExclusao({ isOpen: false, imagemId: null })
  }

  const confirmarExclusao = async () => {
    if (!confirmacaoExclusao.imagemId) return

    try {
      const sucesso = await imageApiService.excluir(confirmacaoExclusao.imagemId)
      if (sucesso) {
        const updatedImages = imagens.filter(img => img.id !== confirmacaoExclusao.imagemId)
        setImagens(updatedImages)
        
        // Atualizar cache
        if (user?.id) {
          const imagesWithTimestamp = Object.assign(updatedImages, { _timestamp: Date.now() })
          cacheService.setImagesList(user.id, imagesWithTimestamp, 5 * 60 * 1000)
        }
        setModalAberto(false)
        fecharConfirmacaoExclusao()
        // Recarregar dados para atualizar contadores
        carregarDados()
        toast.success('Imagem excluída com sucesso!')
      } else {
        toast.error('Imagem não encontrada')
      }
    } catch (error) {
      console.error('Erro ao excluir imagem do Storage:', error)
      toast.error('Erro ao excluir imagem')
    }
  }



  const imagensFiltradas = imagens.filter(img => {
    const matchEstilo = !filtroEstilo || img.tipo === filtroEstilo
    const matchCliente = !filtroCliente || img.cliente_id?.toLowerCase().includes(filtroCliente.toLowerCase())
    return matchEstilo && matchCliente
  })

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para extrair o estilo de cílio da descrição
  const extrairEstiloCilio = (descricao: string | null | undefined) => {
    if (!descricao) return 'Não especificado'
    
    // Procura por padrões como "estilo Volume Russo", "com estilo Clássico", etc.
    const match = descricao.match(/(?:estilo|com estilo)\s+([^-]+)/i)
    if (match) {
      return match[1].trim()
    }
    
    // Se não encontrar o padrão, retorna a descrição completa
    return descricao
  }



  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">
            {userLoading ? 'Carregando usuário...' : 'Carregando suas imagens...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
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
              Minhas Criações
            </h1>
            <p className="text-gray-600 mt-2">✨ Gerencie suas imagens processadas</p>
          </div>
          <Button
            onClick={() => navigate('/aplicar-cilios')}
            variant="primary"
            className="shadow-elegant hover:scale-105 transition-transform"
          >
            ✨ Nova Visualização
          </Button>
        </div>



        {/* Filtros */}
        {imagens.length > 0 && (
          <div className="card-elegant p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎨 Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💄 Filtrar por Estilo
                </label>
                <select
                  value={filtroEstilo}
                  onChange={(e) => setFiltroEstilo(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="">Todos os estilos</option>
                  {estilos.map((estilo) => (
                    <option key={estilo} value={estilo}>
                      {estilo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Filtrar por Cliente
                </label>
                <input
                  type="text"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  placeholder="Nome da cliente..."
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            {(filtroEstilo || filtroCliente) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💫 Mostrando {imagensFiltradas.length} de {imagens.length} imagens
                </p>
                <button
                  onClick={() => {
                    setFiltroEstilo('')
                    setFiltroCliente('')
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-primary-600 group-hover:scale-110 transition-transform">
              {imagens.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">📷 Total de Imagens</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">
              {imagens.filter(img => img.tipo === 'depois').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">✅ Processadas</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-secondary-600 group-hover:scale-110 transition-transform">
              {new Set(imagens.map(img => img.tipo)).size}
            </div>
            <div className="text-sm text-gray-600 mt-1">🎨 Estilos Únicos</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
              {clientes.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">👤 Clientes</div>
          </div>
        </div>

        {/* Grid de Imagens */}
        {imagens.length === 0 ? (
          <div className="card-elegant p-12 text-center">
            <div className="text-6xl mb-6">🖼️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma imagem encontrada
            </h3>
            <p className="text-gray-600 mb-8">
              ✨ Comece criando sua primeira visualização de cílios
            </p>
            <Button
              onClick={() => navigate('/aplicar-cilios')}
              variant="primary"
              className="shadow-elegant hover:scale-105 transition-transform"
            >
              ✨ Criar Nova Visualização
              </Button>
            </div>
          ) : imagensFiltradas.length === 0 ? (
            <div className="card-elegant p-12 text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Nenhuma imagem encontrada com os filtros aplicados
              </h3>
              <p className="text-gray-600 mb-8">
                Tente ajustar os filtros ou limpar para ver todas as imagens
              </p>
              <button
                onClick={() => {
                  setFiltroEstilo('')
                  setFiltroCliente('')
                }}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {imagensFiltradas.map((imagem) => (
                <div
                  key={imagem.id}
                  className="card-interactive group cursor-pointer"
                  onClick={() => {
                    setImagemSelecionada(imagem)
                    setModalAberto(true)
                  }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl relative overflow-hidden mb-4">
                    <img
                      src={imagem.url}
                      alt={imagem.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {imagem.tipo && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-xl text-xs font-medium shadow-lg">
                        {imagem.tipo}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {imagem.nome}
                    </h3>
                    {imagem.descricao && (
                      <p className="text-sm text-primary-600 flex items-center">
                        <span className="mr-1">💄</span>
                        {imagem.descricao}
                      </p>
                    )}
                    {imagem.cliente_id && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="text-secondary-500 mr-1">👤</span>
                        {imagem.cliente_id}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="mr-1">📅</span>
                      {new Date(imagem.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Modal de Detalhes */}
        {modalAberto && imagemSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-elegant max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  🖼️ Detalhes da Imagem
                </h2>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl hover:scale-110 transition-all"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
                  <img
                    src={imagemSelecionada.url}
                    alt={imagemSelecionada.nome}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-4">
                  {/* Cílio Utilizado */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="mr-2">💄</span>
                      Cílio Utilizado
                    </label>
                    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-xl mt-2">
                      <p className="text-primary-700 font-medium text-lg">
                        {extrairEstiloCilio(imagemSelecionada.descricao)}
                      </p>
                    </div>
                  </div>

                  {/* Data de Geração */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="mr-2">📅</span>
                      Data de Geração
                    </label>
                    <div className="bg-gray-50 p-4 rounded-xl mt-2">
                      <p className="text-gray-900 font-medium">
                        {formatarData(imagemSelecionada.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => setModalAberto(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => abrirConfirmacaoExclusao(imagemSelecionada.id)}
                    variant="secondary"
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card de Confirmação de Exclusão */}
        <ConfirmationCard
          isOpen={confirmacaoExclusao.isOpen}
          title="Excluir Imagem"
          message="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          onConfirm={confirmarExclusao}
          onCancel={fecharConfirmacaoExclusao}
          type="danger"
          icon="🗑️"
        />
      </div>
    </div>
  )
}

export default MinhasImagensPage