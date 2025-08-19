import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, validateMethod, validatePaginationParams, validateSortParams, validateSearchTerm, AuthenticationError } from './middleware/validation';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function validateAuth(req) {
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
    }
    catch (error) {
        console.error('Erro na validação de autenticação:', error);
        return null;
    }
}
async function getDirectoryStats(userId) {
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
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return null;
    }
}
async function getUserImages(userId, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc') {
    try {
        const offset = (page - 1) * limit;
        const { count } = await supabase
            .from('imagens_clientes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        const { data: images, error } = await supabase
            .from('imagens_clientes')
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
    }
    catch (error) {
        console.error('Erro ao buscar imagens:', error);
        throw error;
    }
}
const listHandler = async (req, res) => {
    validateMethod(req, ['GET']);
    const authResult = await validateAuth(req);
    if (!authResult || !authResult.userId) {
        throw new AuthenticationError('Falha na autenticação');
    }
    const { userId, user } = authResult;
    const { page = '1', limit = '20', sortBy = 'created_at', sortOrder = 'desc', search = '' } = req.query;
    const { page: pageNum, limit: limitNum, offset } = validatePaginationParams({
        page: parseInt(page),
        limit: parseInt(limit)
    });
    const { sortBy: validSortBy, sortOrder: validSortOrder } = validateSortParams({
        sortBy: sortBy,
        sortOrder: sortOrder
    });
    const searchTerm = validateSearchTerm(search);
    const directoryStats = await getDirectoryStats(userId);
    let query = supabase
        .from('imagens_clientes')
        .select('*')
        .eq('user_id', userId)
        .order(validSortBy, { ascending: validSortOrder === 'asc' })
        .range(offset, offset + limitNum - 1);
    if (searchTerm) {
        query = query.or(`filename.ilike.%${searchTerm}%,original_name.ilike.%${searchTerm}%`);
    }
    const { data: images, error: imagesError } = await query;
    if (imagesError) {
        throw new Error(`Erro ao buscar imagens: ${imagesError.message}`);
    }
    let countQuery = supabase
        .from('imagens_clientes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    if (searchTerm) {
        countQuery = countQuery.or(`filename.ilike.%${searchTerm}%,original_name.ilike.%${searchTerm}%`);
    }
    const { count: totalImages, error: countError } = await countQuery;
    if (countError) {
        throw new Error(`Erro ao contar imagens: ${countError.message}`);
    }
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
