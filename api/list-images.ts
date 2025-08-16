import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { 
  withErrorHandling,
  validateAuth,
  validateMethod,
  validatePagination,
  validateSortOrder,
  validateSearchTerm,
  handleApiError
} from '../src/middleware/validation';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageListItem {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

interface DirectoryStats {
  total_images: number;
  total_size: number;
  directory_path: string;
  created_at: string;
  updated_at: string;
}

/**
 * Valida o token de autenticação
 */
async function validateAuth(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Erro na validação de autenticação:', error);
    return null;
  }
}

/**
 * Busca estatísticas do diretório do usuário
 */
async function getDirectoryStats(userId: string): Promise<DirectoryStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_image_directories')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}

/**
 * Busca imagens do usuário com paginação
 */
async function getUserImages(
  userId: string, 
  page: number = 1, 
  limit: number = 20,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{ images: ImageListItem[], total: number }> {
  try {
    const offset = (page - 1) * limit;

    // Buscar total de imagens
    const { count } = await supabase
      .from('user_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Buscar imagens com paginação
    const { data: images, error } = await supabase
      .from('user_images')
      .select(`
        id,
        filename,
        original_name,
        file_size,
        mime_type,
        width,
        height,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      images: images || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    throw error;
  }
}

/**
 * Handler principal da API
 */
const listHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validar método HTTP
  validateMethod(req, ['GET']);
  
  // Validar autenticação
  const { user, userId } = await validateAuth(req);

  // Extrair e validar parâmetros de query
  const {
    page = '1',
    limit = '20',
    sortBy = 'created_at',
    sortOrder = 'desc',
    search = ''
  } = req.query;
 
  // Validar paginação
  const { page: pageNum, limit: limitNum, offset } = validatePagination(
    parseInt(page as string),
    parseInt(limit as string)
  );
 
  // Validar ordenação
  const { sortBy: validSortBy, sortOrder: validSortOrder } = validateSortOrder(
    sortBy as string,
    sortOrder as string,
    ['created_at', 'updated_at', 'filename', 'original_name', 'file_size']
  );
 
  // Validar termo de busca
  const searchTerm = validateSearchTerm(search as string);

  // Buscar estatísticas do diretório
  const directoryStats = await getDirectoryStats(userId);

  // Construir query base
  let query = supabase
    .from('user_images')
    .select('*')
    .eq('user_id', userId)
    .order(validSortBy, { ascending: validSortOrder === 'asc' })
    .range(offset, offset + limitNum - 1);
 
  // Adicionar filtro de busca se fornecido
  if (searchTerm) {
    query = query.or(`filename.ilike.%${searchTerm}%,original_name.ilike.%${searchTerm}%`);
  }
 
  // Executar query
  const { data: images, error: imagesError } = await query;
 
  if (imagesError) {
    throw new Error(`Erro ao buscar imagens: ${imagesError.message}`);
  }
 
  // Buscar total de imagens para paginação
  let countQuery = supabase
    .from('user_images')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
 
  if (searchTerm) {
    countQuery = countQuery.or(`filename.ilike.%${searchTerm}%,original_name.ilike.%${searchTerm}%`);
  }
 
  const { count: totalImages, error: countError } = await countQuery;
 
  if (countError) {
    throw new Error(`Erro ao contar imagens: ${countError.message}`);
  }
 
  // Calcular informações de paginação
  const totalPages = Math.ceil((totalImages || 0) / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;
 
  res.status(200).json({
    success: true,
    data: {
      images: images || [],
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalImages || 0,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage
      },
      directoryStats: directoryStats || {
        total_images: 0,
        total_size: 0,
        last_upload: null
      },
      searchTerm
    }
  });
};
 
export default withErrorHandling(listHandler);