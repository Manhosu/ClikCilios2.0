import { supabase } from '../lib/supabase';

export interface ImagemCliente {
  id: string;
  cliente_id: string;
  user_id: string;
  nome: string;
  url: string;
  tipo: 'antes' | 'depois' | 'processo';
  descricao?: string;
  created_at: string;
}

export interface ImageListResponse {
  images: ImagemCliente[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  directory_stats: {
    total_images: number;
    total_size: number;
    total_size_mb: number;
    directory_path: string;
    created_at: string;
    updated_at: string;
  } | null;
  sort: {
    field: string;
    order: string;
  };
}

// Função para obter token de autenticação
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao obter sessão:', error.message);
      return null;
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

// Serviço que usa a API list-images
export const imageApiService = {
  async listar(page: number = 1, limit: number = 50): Promise<ImagemCliente[]> {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        console.warn('⚠️ Usuário não autenticado');
        return [];
      }

      const url = new URL('/api/list-images', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('sort_field', 'created_at');
      url.searchParams.set('sort_order', 'desc');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ Token expirado ou inválido');
          return [];
        }
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data: ImageListResponse = await response.json();
      
      console.log('📊 Imagens carregadas via API:', {
        totalImagens: data.images.length,
        totalPaginas: data.pagination.total_pages,
        paginaAtual: data.pagination.current_page
      });

      return data.images;
    } catch (error) {
      console.error('❌ Erro ao carregar imagens via API:', error);
      return [];
    }
  },

  async excluir(imageId: string): Promise<boolean> {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        console.warn('⚠️ Usuário não autenticado');
        return false;
      }

      const response = await fetch('/api/delete-images', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_ids: [imageId] }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ Token expirado ou inválido');
          return false;
        }
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.success && data.data.successful_deletions > 0;
    } catch (error) {
      console.error('❌ Erro ao excluir imagem via API:', error);
      return false;
    }
  }
};