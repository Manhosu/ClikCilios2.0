import { supabase } from '../lib/supabase'
import { generateId } from '../utils/generateId'
import { v4 as uuidv4 } from 'uuid'
// Force update to trigger Vite recompilation

// Função para obter token de autenticação
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao obter sessão:', error.message);
      // Tentar renovar a sessão
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Erro ao renovar token:', refreshError.message);
        return null;
      }
      
      console.log('✅ Token renovado com sucesso');
      return refreshedSession?.access_token || null;
    }
    
    if (!session?.access_token) {
      console.warn('⚠️ Nenhum token de acesso encontrado');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('❌ Erro crítico ao obter token:', error);
    return null;
  }
}

export interface ImagemCliente {
  id: string
  cliente_id: string
  user_id: string
  nome: string
  url: string
  tipo: 'antes' | 'depois' | 'processo'
  descricao?: string
  filename?: string
  original_name?: string
  file_size?: number
  mime_type?: string
  width?: number
  height?: number
  storage_path?: string
  created_at: string
  updated_at?: string
}

export interface ImageListResponse {
  images: ImagemCliente[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  directoryStats?: {
    total_images: number;
    total_size: number;
    total_size_mb: number;
    directory_path: string;
    created_at: string;
    updated_at: string;
  } | null;
  searchTerm?: string;
}

// Serviço principal
export const imagensService = {
  async listar(userId?: string, clienteId?: string): Promise<ImagemCliente[]> {
    try {
      let query = supabase
        .from('imagens_clientes')
        .select('*')
        .order('created_at', { ascending: false })

      // Sempre filtrar por user_id se fornecido
      if (userId) {
        query = query.eq('user_id', userId)
      }

      // Filtrar por cliente específico se fornecido
      if (clienteId) {
        query = query.eq('cliente_id', clienteId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar imagens:', error)
        throw new Error(`Erro ao carregar imagens: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro na consulta de imagens:', error)
      throw error
    }
  },

  async criar(dadosImagem: Omit<ImagemCliente, 'id' | 'created_at'>): Promise<ImagemCliente> {
    try {
      const novaImagem = {
        ...dadosImagem,
        id: generateId(),
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('imagens_clientes')
        .insert([novaImagem])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar imagem:', error)
        throw new Error(`Erro ao criar imagem: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro na criação de imagem:', error)
      throw error
    }
  },

  async atualizar(id: string, dadosImagem: Partial<ImagemCliente>): Promise<ImagemCliente | null> {
    try {
      const { data, error } = await supabase
        .from('imagens_clientes')
        .update(dadosImagem)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar imagem:', error)
        throw new Error(`Erro ao atualizar imagem: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro na atualização de imagem:', error)
      throw error
    }
  },

  async excluir(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('imagens_clientes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir imagem:', error)
        throw new Error(`Erro ao excluir imagem: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Erro na exclusão de imagem:', error)
      throw error
    }
  },

  async salvarViaAPI(dadosImagem: Omit<ImagemCliente, 'id' | 'created_at' | 'user_id'>): Promise<ImagemCliente> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/save-client-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosImagem)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao salvar imagem');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao salvar imagem via API:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao salvar imagem');
    }
  },

  /**
   * Faz upload de uma imagem diretamente para o Supabase Storage.
   * @param file O arquivo de imagem a ser enviado.
   * @param userId O ID do usuário para organizar os arquivos.
   * @returns A URL pública da imagem salva.
   */
  async uploadToStorage(file: File, userId: string): Promise<string> {
    if (!userId) {
      throw new Error('O ID do usuário é necessário para o upload.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('mcp')
      .upload(filePath, file);

    if (error) {
      console.error('Erro no upload para o Supabase Storage:', error);
      throw new Error(`Falha no upload da imagem: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('mcp')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    return publicUrl;
  },

  /**
   * Valida se um arquivo é uma imagem válida
   */
  validateImageFile(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado. Aceitos: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  },

  /**
   * Formata tamanho de arquivo em formato legível
   */
  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Obtém informações de uma imagem (dimensões, etc.)
   */
  async getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      
      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  },

  /**
   * Obtém URL para visualizar uma imagem
   */
  getImageUrl(imageId: string): string {
    return `/api/serve-image?imageId=${encodeURIComponent(imageId)}`;
  },

  /**
   * Obtém URL para visualizar uma imagem com parâmetros de redimensionamento
   */
  getImageUrlWithParams(imageId: string, params?: {
    width?: number;
    height?: number;
    quality?: number;
  }): string {
    const url = new URL(`/api/serve-image`, window.location.origin);
    url.searchParams.set('imageId', imageId);
    
    if (params?.width) {
      url.searchParams.set('w', params.width.toString());
    }
    
    if (params?.height) {
      url.searchParams.set('h', params.height.toString());
    }
    
    if (params?.quality) {
      url.searchParams.set('q', params.quality.toString());
    }
    
    return url.toString();
  },

  /**
   * Lista imagens do usuário via API
   */
  async listarViaAPI({
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ImageListResponse> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/list-images?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao listar imagens');
      }

      return result.data;
    } catch (error) {
      console.error('Erro ao listar imagens via API:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao listar imagens');
    }
  },

  /**
   * Deleta uma ou múltiplas imagens
   */
  async deletarViaAPI(imageIds: string | string[]): Promise<{
    success: boolean;
    message: string;
    data: {
      total_requested: number;
      successful_deletions: number;
      failed_deletions: number;
      deleted_images: string[];
      failed_images: string[];
      errors: { [key: string]: string };
    };
  }> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
      
      const params = new URLSearchParams();
      if (ids.length === 1) {
        params.append('imageId', ids[0]);
      } else {
        params.append('imageIds', JSON.stringify(ids));
      }

      const response = await fetch(`/api/delete-image?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao deletar imagens via API:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao deletar imagens');
    }
  }
}