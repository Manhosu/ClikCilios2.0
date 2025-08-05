import { isDevMode } from '../lib/supabase'

export interface Imagem {
  id: string
  nome_arquivo: string
  url_original: string
  url_processada?: string
  estilo_aplicado?: string
  cliente_nome?: string
  observacoes?: string
  created_at: string
}

// Chave para armazenamento local
const STORAGE_KEY = 'ciliosclick_imagens'

// Gerar ID único para desenvolvimento
const generateId = () => `imagem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Gerenciamento local de imagens
class ImagensLocalStorage {
  private getImagens(): Imagem[] {
    try {
      const dados = localStorage.getItem(STORAGE_KEY)
      return dados ? JSON.parse(dados) : []
    } catch (error) {
      console.warn('Erro ao carregar imagens do localStorage:', error)
      return []
    }
  }

  private salvarImagens(imagens: Imagem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imagens))
    } catch (error) {
      console.error('Erro ao salvar imagens no localStorage:', error)
    }
  }

  async listar(): Promise<Imagem[]> {
    const imagens = this.getImagens()
    // Em modo desenvolvimento local, retornar todas as imagens (não há separação por usuário)
    return imagens
  }

  async criar(dadosImagem: Omit<Imagem, 'id' | 'created_at'>): Promise<Imagem> {
    const novaImagem: Imagem = {
      ...dadosImagem,
      id: generateId(),
      created_at: new Date().toISOString()
    }

    const imagens = this.getImagens()
    imagens.push(novaImagem)
    this.salvarImagens(imagens)

    return novaImagem
  }

  async atualizar(id: string, dadosImagem: Partial<Imagem>): Promise<Imagem | null> {
    const imagens = this.getImagens()
    const index = imagens.findIndex(i => i.id === id)

    if (index === -1) return null

    imagens[index] = { ...imagens[index], ...dadosImagem }
    this.salvarImagens(imagens)

    return imagens[index]
  }

  async excluir(id: string): Promise<boolean> {
    const imagens = this.getImagens()
    const novaLista = imagens.filter(i => i.id !== id)

    if (novaLista.length === imagens.length) return false

    this.salvarImagens(novaLista)
    return true
  }
}

// Instância do gerenciador local
const imagensLocal = new ImagensLocalStorage()

// Serviço principal
export const imagensService = {
  async listar(_userId: string): Promise<Imagem[]> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - carregando imagens do localStorage')
      return await imagensLocal.listar()
    }

    // TODO: Implementar integração com Supabase quando tabela 'imagens' for criada
    console.warn('⚠️ Tabela imagens não implementada no Supabase ainda')
    return []
  },

  async criar(_userId: string, dadosImagem: Omit<Imagem, 'id' | 'created_at'>): Promise<Imagem> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - salvando imagem no localStorage')
      return await imagensLocal.criar(dadosImagem)
    }

    // TODO: Implementar integração com Supabase quando tabela 'imagens' for criada
    throw new Error('Tabela imagens não implementada no Supabase ainda')
  },

  async atualizar(id: string, dadosImagem: Partial<Imagem>): Promise<Imagem | null> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - atualizando imagem no localStorage')
      return await imagensLocal.atualizar(id, dadosImagem)
    }

    // TODO: Implementar integração com Supabase quando tabela 'imagens' for criada
    throw new Error('Tabela imagens não implementada no Supabase ainda')
  },

  async excluir(id: string): Promise<boolean> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - excluindo imagem do localStorage')
      return await imagensLocal.excluir(id)
    }

    // TODO: Implementar integração com Supabase quando tabela 'imagens' for criada
    throw new Error('Tabela imagens não implementada no Supabase ainda')
  }
}