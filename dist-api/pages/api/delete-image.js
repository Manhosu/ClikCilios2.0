import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { withErrorHandling, validateMethod, validateImageIds } from './middleware/validation.js';
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
async function getImageRecord(imageId, userId) {
    try {
        const { data, error } = await supabase
            .from('imagens_clientes')
            .select('*')
            .eq('id', imageId)
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            return null;
        }
        return data;
    }
    catch (error) {
        console.error('Erro ao buscar imagem:', error);
        return null;
    }
}
async function deletePhysicalFile(filePath) {
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error('Erro ao deletar arquivo físico:', error);
        return false;
    }
}
async function deleteImageRecord(imageId, userId) {
    try {
        const { error } = await supabase
            .from('imagens_clientes')
            .delete()
            .eq('id', imageId)
            .eq('user_id', userId);
        if (error) {
            throw error;
        }
        return true;
    }
    catch (error) {
        console.error('Erro ao deletar registro:', error);
        return false;
    }
}
async function updateDirectoryStats(userId) {
    try {
        const { data: images } = await supabase
            .from('imagens_clientes')
            .select('file_size')
            .eq('user_id', userId);
        if (images) {
            const totalImages = images.length;
            const totalSize = images.reduce((sum, img) => sum + img.file_size, 0);
            await supabase
                .from('user_image_directories')
                .update({
                total_images: totalImages,
                total_size: totalSize,
                updated_at: new Date().toISOString()
            })
                .eq('user_id', userId);
        }
    }
    catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}
async function deleteMultipleImages(imageIds, userId) {
    const results = {
        success: [],
        failed: [],
        errors: {}
    };
    for (const imageId of imageIds) {
        try {
            const imageRecord = await getImageRecord(imageId, userId);
            if (!imageRecord) {
                results.failed.push(imageId);
                results.errors[imageId] = 'Imagem não encontrada';
                continue;
            }
            const fileDeleted = await deletePhysicalFile(imageRecord.file_path);
            const recordDeleted = await deleteImageRecord(imageId, userId);
            if (recordDeleted) {
                results.success.push(imageId);
                if (!fileDeleted) {
                    results.errors[imageId] = 'Registro removido, mas arquivo físico não foi encontrado';
                }
            }
            else {
                results.failed.push(imageId);
                results.errors[imageId] = 'Falha ao remover registro do banco';
            }
        }
        catch (error) {
            results.failed.push(imageId);
            results.errors[imageId] = error instanceof Error ? error.message : 'Erro desconhecido';
        }
    }
    return results;
}
const deleteHandler = async (req, res) => {
    validateMethod(req, ['DELETE']);
    const { user, userId } = await validateAuth(req);
    const { imageIds } = req.body;
    const validatedIds = validateImageIds(imageIds);
    const results = await deleteMultipleImages(validatedIds, userId);
    if (results.success.length > 0) {
        await updateDirectoryStats(userId);
    }
    let statusCode = 200;
    if (results.success.length === 0) {
        statusCode = 400;
    }
    else if (results.failed.length > 0) {
        statusCode = 207;
    }
    res.status(statusCode).json({
        success: results.success.length > 0,
        message: results.success.length === validatedIds.length
            ? 'Todas as imagens foram deletadas com sucesso'
            : results.success.length > 0
                ? 'Algumas imagens foram deletadas com sucesso'
                : 'Nenhuma imagem foi deletada',
        data: {
            total_requested: validatedIds.length,
            successful_deletions: results.success.length,
            failed_deletions: results.failed.length,
            deleted_images: results.success,
            failed_images: results.failed,
            errors: results.errors
        }
    });
};
export default withErrorHandling(deleteHandler);
