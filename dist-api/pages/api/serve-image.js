import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import mime from 'mime-types';
import { withErrorHandling, validateAuth, validateMethod, validateImageId } from './middleware/validation';
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
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function setCacheHeaders(res, mimeType) {
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
}
function parseResizeParams(query) {
    const width = query.w ? parseInt(query.w) : undefined;
    const height = query.h ? parseInt(query.h) : undefined;
    const quality = query.q ? Math.min(100, Math.max(1, parseInt(query.q))) : undefined;
    return {
        width: width && width > 0 && width <= 2000 ? width : undefined,
        height: height && height > 0 && height <= 2000 ? height : undefined,
        quality: quality || 85
    };
}
const serveHandler = async (req, res) => {
    validateMethod(req, ['GET']);
    const authResult = await validateAuth(req);
    if (!authResult || !authResult.userId) {
        throw new Error('Falha na autenticação');
    }
    const { user, userId } = authResult;
    const { imageId } = req.query;
    const validatedImageId = validateImageId(imageId);
    const imageRecord = await getImageRecord(validatedImageId, userId);
    if (!imageRecord) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    const exists = await fileExists(imageRecord.file_path);
    if (!exists) {
        return res.status(404).json({
            error: 'Arquivo físico não encontrado',
            details: 'A imagem existe no banco de dados mas o arquivo físico não foi encontrado'
        });
    }
    const resizeParams = parseResizeParams(req.query);
    const mimeType = imageRecord.mime_type || mime.lookup(imageRecord.file_path) || 'application/octet-stream';
    setCacheHeaders(res, mimeType);
    res.setHeader('Content-Length', imageRecord.file_size);
    res.setHeader('Content-Disposition', `inline; filename="${imageRecord.filename}"`);
    if (imageRecord.width && imageRecord.height) {
        res.setHeader('X-Image-Width', imageRecord.width.toString());
        res.setHeader('X-Image-Height', imageRecord.height.toString());
    }
    const fileBuffer = await fs.readFile(imageRecord.file_path);
    res.send(fileBuffer);
};
export default withErrorHandling(serveHandler);
export const config = {
    api: {
        responseLimit: '10mb',
    },
};
