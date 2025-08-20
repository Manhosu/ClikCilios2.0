import { imagensService } from './imagensService';

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

/**
 * Serviço que usa o Supabase Storage diretamente
 * Mantém a mesma interface para compatibilidade
 */
export const imageApiService = {
  /**
   * Lista imagens do Supabase Storage
   * @param page Número da página (não usado, mantido para compatibilidade)
   * @param limit Limite de itens (não usado, mantido para compatibilidade)
   * @returns Array de imagens ou array vazio em caso de erro
   */
  async listar(_page: number = 1, _limit: number = 50): Promise<ImagemCliente[]> {
    try {
      // Obter userId do contexto - necessário para buscar do Storage
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ Usuário não autenticado');
        return [];
      }

      console.log('🔄 [imageApiService.listar] Listando imagens do Storage...');
      
      // Usar o novo método do imagensService que lista do Storage
      const result = await imagensService.listarDoStorage(userId);
      
      if (!result.success) {
        console.error('❌ Erro ao listar imagens do Storage');
        return [];
      }
      
      console.log('📊 Imagens carregadas do Storage:', {
        totalImagens: result.data.length,
        userId
      });

      return result.data;
    } catch (error) {
      console.error('❌ Erro ao carregar imagens:', error);
      return [];
    }
  },

  /**
   * Exclui uma imagem do Storage e banco
   * @param imageId ID da imagem a ser excluída
   * @returns true se a exclusão foi bem-sucedida, false caso contrário
   */
  async excluir(imageId: string): Promise<boolean> {
    try {
      // Obter userId do contexto
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ Usuário não autenticado');
        return false;
      }

      // Validar parâmetro
      if (!imageId || typeof imageId !== 'string') {
        console.error('❌ ID da imagem inválido:', imageId);
        return false;
      }

      console.log('🔄 [imageApiService.excluir] Excluindo imagem:', imageId);
      
      // Usar o novo método do imagensService que exclui do Storage
      const result = await imagensService.excluirDoStorage(imageId, userId);
      
      if (result.success) {
        console.log('✅ Imagem excluída com sucesso:', imageId);
      } else {
        console.warn('⚠️ Falha ao excluir imagem:', imageId, result.message);
      }
      
      return result.success;
    } catch (error) {
      console.error('❌ Erro ao excluir imagem:', error);
      return false;
    }
  },

  /**
   * Método auxiliar para obter userId atual
   * @returns string com userId ou null se não autenticado
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      // Importar supabase diretamente para evitar dependência circular
      const { supabase } = await import('../lib/supabase');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn('⚠️ Usuário não encontrado:', error?.message);
        return null;
      }
      
      return user.id;
    } catch (error) {
      console.error('❌ Erro ao obter userId:', error);
      return null;
    }
  }
};