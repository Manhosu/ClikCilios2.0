import { supabase } from '../lib/supabase'
import { authClient } from '../lib/authClient'
import { cacheService } from './cacheService'
import { generateId } from '../utils/generateId'
import { v4 as uuidv4 } from 'uuid'
import { API_BASE_URL } from '../config/api'
// Force update to trigger Vite recompilation

export interface ImagemCliente {
  id: string
  cliente_id: string
  user_id: string
  nome: string
  url: string
  tipo: 'antes' | 'depois' | 'processo'
  descricao?: string
  nome_arquivo?: string
  filename?: string
  original_name?: string
  file_size?: number
  mime_type?: string
  width?: number
  height?: number
  storage_path?: string
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
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
      // Gerar chave de cache única
      const cacheKey = `images_${userId || 'all'}_${clienteId || 'all'}`
      
      // Verificar cache primeiro
      const cached = cacheService.get<ImagemCliente[]>(cacheKey)
      if (cached && Date.now() - ((cached as any)._cacheTime || 0) < 3 * 60 * 1000) { // 3 min cache
        console.log('✅ [ImagensService] Usando imagens do cache')
        return cached.filter((img: any) => img && img.id) // Filtrar items válidos
      }
      
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
        
        // Retornar cache mesmo expirado em caso de erro
        if (cached) {
          console.log('⚠️ [ImagensService] Usando cache expirado devido a erro')
          return cached.filter((img: any) => img && img.id)
        }
        
        throw new Error(`Erro ao carregar imagens: ${error.message}`)
      }

      const images = data || []
      
      // Salvar no cache com timestamp
      const imagesWithCache = Object.assign(images, { _cacheTime: Date.now() }) as ImagemCliente[]
      cacheService.set(cacheKey, imagesWithCache, 5 * 60 * 1000) // 5 min cache
      
      console.log(`✅ [ImagensService] ${images.length} imagens carregadas e salvas no cache`)
      return images
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


  /**
   * Lista imagens do Supabase Storage para o usuário
   */
  async listarDoStorage(userId: string): Promise<{ success: boolean; data: ImagemCliente[] }> {
    try {
      console.log('🔄 [listarDoStorage] Listando imagens do Storage para usuário:', userId);
      
      // Listar arquivos do bucket minhas-imagens
      const { data: files, error: storageError } = await supabase.storage
        .from('minhas-imagens')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        console.error('❌ [listarDoStorage] Erro ao listar do Storage:', storageError);
        return { success: false, data: [] };
      }

      if (!files || files.length === 0) {
        console.log('📂 [listarDoStorage] Nenhuma imagem encontrada no Storage');
        return { success: true, data: [] };
      }

      // Buscar metadados das imagens no banco
      const { data: imagensDB, error: dbError } = await supabase
        .from('imagens_clientes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('❌ [listarDoStorage] Erro ao buscar metadados:', dbError);
        return { success: false, data: [] };
      }

      // Combinar dados do Storage com metadados do banco
      const imagesWithUrls: ImagemCliente[] = [];
      
      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        
        const filePath = `${userId}/${file.name}`;
        const { data: { publicUrl } } = supabase.storage
          .from('minhas-imagens')
          .getPublicUrl(filePath);

        // Buscar metadados do banco
        const dbImage = imagensDB?.find(img => 
          img.filename === file.name || 
          img.storage_path === filePath
        );

        const imageData: ImagemCliente = {
          id: dbImage?.id || uuidv4(),
          cliente_id: dbImage?.cliente_id || 'default',
          user_id: userId,
          nome: dbImage?.nome || file.name,
          url: publicUrl,
          tipo: dbImage?.tipo || 'depois',
          descricao: dbImage?.descricao,
          filename: file.name,
          original_name: dbImage?.original_name || file.name,
          file_size: file.metadata?.size || 0,
          mime_type: file.metadata?.mimetype || 'image/jpeg',
          width: dbImage?.width,
          height: dbImage?.height,
          storage_path: filePath,
          processing_status: dbImage?.processing_status || 'completed',
          created_at: dbImage?.created_at || file.created_at || new Date().toISOString(),
          updated_at: dbImage?.updated_at || file.updated_at
        };
        
        imagesWithUrls.push(imageData);
      }

      console.log(`✅ [listarDoStorage] ${imagesWithUrls.length} imagens carregadas do Storage`);
      return { success: true, data: imagesWithUrls };
    } catch (error) {
      console.error('❌ [listarDoStorage] Erro completo:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Exclui uma imagem do Storage e do banco
   */
  async excluirDoStorage(imageId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 [excluirDoStorage] Excluindo imagem:', imageId);
      
      // Buscar dados da imagem no banco
      const { data: imagemDB, error: dbError } = await supabase
        .from('imagens_clientes')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single();

      if (dbError || !imagemDB) {
        console.error('❌ [excluirDoStorage] Imagem não encontrada no banco:', dbError);
        return { success: false, message: 'Imagem não encontrada' };
      }

      // Excluir do Storage se tiver storage_path
      if (imagemDB.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('minhas-imagens')
          .remove([imagemDB.storage_path]);

        if (storageError) {
          console.error('❌ [excluirDoStorage] Erro ao excluir do Storage:', storageError);
          // Continua mesmo com erro no Storage para limpar banco
        }
      }

      // Excluir do banco
      const { error: deleteError } = await supabase
        .from('imagens_clientes')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ [excluirDoStorage] Erro ao excluir do banco:', deleteError);
        return { success: false, message: 'Erro ao excluir imagem do banco' };
      }

      console.log('✅ [excluirDoStorage] Imagem excluída com sucesso');
      return { success: true, message: 'Imagem excluída com sucesso' };
    } catch (error) {
      console.error('❌ [excluirDoStorage] Erro completo:', error);
      return { success: false, message: 'Erro interno ao excluir imagem' };
    }
  },

  /**
   * Verifica se o bucket 'minhas-imagens' existe e está acessível
   */
  async verificarBucket(): Promise<{ exists: boolean; error?: string }> {
    try {
      console.log('[ImagensService] Verificando existência do bucket minhas-imagens...');
      
      // Tentar listar o bucket para verificar se existe e está acessível
      const { error } = await supabase.storage
        .from('minhas-imagens')
        .list('', { limit: 1 });

      if (error) {
        console.error('[ImagensService] Erro ao verificar bucket:', error);
        
        if (error.message && error.message.toLowerCase().includes('bucket')) {
          return { 
            exists: false, 
            error: 'Bucket "minhas-imagens" não encontrado. Precisa ser criado no Dashboard do Supabase.' 
          };
        } else {
          return { 
            exists: false, 
            error: `Erro ao acessar bucket: ${error.message}` 
          };
        }
      }

      console.log('[ImagensService] ✅ Bucket minhas-imagens verificado com sucesso');
      return { exists: true };
    } catch (error) {
      console.error('[ImagensService] Erro na verificação do bucket:', error);
      return { 
        exists: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar bucket' 
      };
    }
  },

  /**
   * Faz upload de uma imagem diretamente para o Supabase Storage.
   * @param file O arquivo de imagem a ser enviado.
   * @param userId O ID do usuário para organizar os arquivos.
   * @returns Objeto com URL pública e metadados da imagem.
   */
  async uploadToStorage(file: File, userId: string): Promise<{
    publicUrl: string;
    metadata: {
      width: number;
      height: number;
      file_size: number;
      mime_type: string;
      original_name: string;
      filename: string;
      storage_path: string;
    };
  }> {
    console.log(`[ImagensService] Iniciando upload para usuário: ${userId}`);
    
    if (!userId) {
      console.error('[ImagensService] ID do usuário não fornecido');
      throw new Error('O ID do usuário é necessário para o upload.');
    }

    // Verificar se o bucket existe antes do upload
    const bucketCheck = await this.verificarBucket();
    if (!bucketCheck.exists) {
      console.error('[ImagensService] Bucket não existe ou não está acessível');
      throw new Error(bucketCheck.error || 'Bucket não está disponível');
    }

    // Validar arquivo
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      console.error(`[ImagensService] Validação de arquivo falhou: ${validation.error}`);
      throw new Error(validation.error);
    }

    // Extrair metadados
    let metadata;
    try {
      metadata = await this.extractImageMetadata(file);
      console.log(`[ImagensService] Metadados extraídos: ${metadata.width}x${metadata.height}, ${metadata.file_size} bytes`);
    } catch (error) {
      console.error('[ImagensService] Erro ao extrair metadados:', error);
      throw new Error('Falha ao processar metadados da imagem');
    }

    // Validar metadados
    const metadataValidation = this.validateImageMetadata(metadata);
    if (!metadataValidation.valid) {
      console.error(`[ImagensService] Validação de metadados falhou: ${metadataValidation.error}`);
      throw new Error(metadataValidation.error);
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    console.log(`[ImagensService] Fazendo upload para: ${filePath}`);

    const { data, error } = await supabase.storage
      .from('minhas-imagens')
      .upload(filePath, file);

    if (error) {
      console.error('[ImagensService] Erro no upload para o Supabase Storage:', error);
      
      // Tratar erros específicos
      if (error.message && error.message.toLowerCase().includes('bucket')) {
        throw new Error(`Bucket não encontrado: O bucket 'minhas-imagens' precisa ser criado no Supabase Storage. Verifique a configuração no Dashboard.`);
      } else if (error.message && error.message.toLowerCase().includes('policy')) {
        throw new Error(`Erro de permissão: Políticas RLS não configuradas para o bucket 'minhas-imagens'. Verifique as permissões no Dashboard.`);
      } else if (error.message && error.message.toLowerCase().includes('size')) {
        throw new Error(`Arquivo muito grande: O limite é de 100MB. Reduza o tamanho da imagem.`);
      } else if (error.message && error.message.toLowerCase().includes('type')) {
        throw new Error(`Tipo de arquivo não permitido: Use apenas JPEG, PNG, WebP ou GIF.`);
      } else {
        throw new Error(`Falha no upload da imagem: ${error.message}`);
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('minhas-imagens')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      console.error('[ImagensService] Não foi possível obter URL pública');
      throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    console.log(`[ImagensService] Upload concluído com sucesso: ${publicUrl}`);

    return {
      publicUrl,
      metadata: {
        ...metadata,
        filename: fileName,
        storage_path: filePath
      }
    };
  },

  /**
   * Extrai metadados de uma imagem
   */
  async extractImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    file_size: number;
    mime_type: string;
    original_name: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          file_size: file.size,
          mime_type: file.type,
          original_name: file.name
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Não foi possível carregar a imagem para extrair metadados'));
      };
      
      img.src = url;
    });
  },

  /**
   * Valida se um arquivo é uma imagem válida
   */
  validateImageFile(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || 100 * 1024 * 1024; // 100MB
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

    if (file.size === 0) {
      return {
        valid: false,
        error: 'Arquivo vazio ou corrompido'
      };
    }

    return { valid: true };
  },

  /**
   * Valida metadados de imagem extraídos
   */
  validateImageMetadata(metadata: {
    width: number;
    height: number;
    file_size: number;
  }, options?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }): { valid: boolean; error?: string } {
    const { width, height, file_size } = metadata;
    const {
      minWidth = 50,
      minHeight = 50,
      maxWidth = 8000,
      maxHeight = 8000
    } = options || {};

    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        error: `Imagem muito pequena. Mínimo: ${minWidth}x${minHeight}px`
      };
    }

    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        error: `Imagem muito grande. Máximo: ${maxWidth}x${maxHeight}px`
      };
    }

    if (file_size <= 0) {
      return {
        valid: false,
        error: 'Tamanho de arquivo inválido'
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
    const url = new URL(`/api/serve-image`, API_BASE_URL);
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
   * Salva imagem no Supabase Storage usando dados base64
   */
  async salvarNoSupabase(imageData: {
    nome: string;
    base64Data: string;
    tipo: string;
    descricao?: string;
    clienteId?: string;
  }): Promise<{ success: boolean; url?: string; imagemId?: string; error?: string; details?: any }> {
    try {
      console.log('🔄 [salvarNoSupabase] Iniciando salvamento no Supabase Storage...');
      
      if (!authClient.isAuthenticated()) {
        console.error('❌ [salvarNoSupabase] Usuário não autenticado');
        throw new Error('Usuário não autenticado - faça login novamente');
      }

      console.log('✅ [salvarNoSupabase] Usuário autenticado, obtendo dados...');

      // Obter dados do usuário
      const user = await authClient.getCurrentUser();
      if (!user?.id) {
        throw new Error('Dados do usuário não disponíveis');
      }

      // Converter base64 para Blob
      const base64WithoutPrefix = imageData.base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteCharacters = atob(base64WithoutPrefix);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Determinar tipo MIME
      const mimeType = imageData.base64Data.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Criar File object
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = `${imageData.nome.replace(/\.[^/.]+$/, '')}.${fileExtension}`;
      const file = new File([blob], fileName, { type: mimeType });

      console.log('🔄 [salvarNoSupabase] Fazendo upload para Storage...');

      // Upload para Supabase Storage
      const uploadResult = await this.uploadToStorage(file, user.id);
      
      console.log('✅ [salvarNoSupabase] Upload concluído, salvando metadados...');

      // Salvar metadados no banco
      const imagemData: Omit<ImagemCliente, 'id' | 'created_at'> = {
        cliente_id: imageData.clienteId || 'default',
        user_id: user.id,
        nome: imageData.nome,
        url: uploadResult.publicUrl,
        tipo: imageData.tipo as 'antes' | 'depois' | 'processo',
        descricao: imageData.descricao,
        nome_arquivo: uploadResult.metadata.filename,
        filename: uploadResult.metadata.filename,
        original_name: uploadResult.metadata.original_name,
        file_size: uploadResult.metadata.file_size,
        mime_type: uploadResult.metadata.mime_type,
        width: uploadResult.metadata.width,
        height: uploadResult.metadata.height,
        storage_path: uploadResult.metadata.storage_path,
        processing_status: 'completed'
      };

      const savedImage = await this.criar(imagemData);

      console.log('✅ [salvarNoSupabase] Imagem salva com sucesso:', savedImage.id);
      
      // Invalidar cache e notificar sobre a criação
      cacheService.invalidateImagesCache(user.id);
      
      return {
        success: true,
        url: uploadResult.publicUrl,
        imagemId: savedImage.id
      };
    } catch (error) {
      console.error('❌ [salvarNoSupabase] Erro completo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar imagem',
        details: error
      };
    }
  },
  
  /**
   * Invalida cache de imagens relacionado
   */
  invalidateImageCache(userId: string): void {
    // Usar o novo sistema de invalidação com notificação
    cacheService.invalidateImagesCache(userId, 'deleted')
    
    console.log('🗑️ [ImagensService] Cache invalidado e evento enviado para usuário:', userId)
  }
}