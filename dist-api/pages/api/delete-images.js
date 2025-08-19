import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { withErrorHandling, validateAuth, validateMethod } from './middleware/validation';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
async function removePhysicalFile(filePath) {
    try {
        await fs.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error('Erro ao remover arquivo físico:', error);
        return false;
    }
}
const deleteHandler = async (req, res) => {
    validateMethod(req, ['DELETE']);
    const authResult = await validateAuth(req);
    if (!authResult || !authResult.userId) {
        throw new Error('Falha na autenticação');
    }
    const { userId } = authResult;
    const { image_ids } = req.body;
    if (!image_ids || !Array.isArray(image_ids) || image_ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'IDs das imagens são obrigatórios',
            data: {
                total_requested: 0,
                successful_deletions: 0,
                failed_deletions: 0,
                deleted_images: [],
                failed_images: [],
                errors: {}
            }
        });
    }
    const results = {
        total_requested: image_ids.length,
        successful_deletions: 0,
        failed_deletions: 0,
        deleted_images: [],
        failed_images: [],
        errors: {}
    };
    for (const imageId of image_ids) {
        try {
            const imageRecord = await getImageRecord(imageId, userId);
            if (!imageRecord) {
                results.failed_deletions++;
                results.failed_images.push(imageId);
                results.errors[imageId] = 'Imagem não encontrada ou não pertence ao usuário';
                continue;
            }
            const { error: dbError } = await supabase
                .from('imagens_clientes')
                .delete()
                .eq('id', imageId)
                .eq('user_id', userId);
            if (dbError) {
                results.failed_deletions++;
                results.failed_images.push(imageId);
                results.errors[imageId] = `Erro no banco de dados: ${dbError.message}`;
                continue;
            }
            if (imageRecord.file_path) {
                const fileRemoved = await removePhysicalFile(imageRecord.file_path);
                if (!fileRemoved) {
                    console.warn(`Arquivo físico não pôde ser removido: ${imageRecord.file_path}`);
                }
            }
            results.successful_deletions++;
            results.deleted_images.push(imageId);
        }
        catch (error) {
            results.failed_deletions++;
            results.failed_images.push(imageId);
            results.errors[imageId] = `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        }
    }
    const success = results.successful_deletions > 0;
    const message = success
        ? `${results.successful_deletions} imagem(ns) excluída(s) com sucesso`
        : 'Nenhuma imagem foi excluída';
    res.status(success ? 200 : 400).json({
        success,
        message,
        data: results
    });
};
export default withErrorHandling(deleteHandler);
