import { createClient } from '@supabase/supabase-js';
import path from 'path';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
export class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends Error {
    constructor(message = 'Usuário não autenticado') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends Error {
    constructor(message = 'Acesso negado') {
        super(message);
        this.name = 'AuthorizationError';
    }
}
export class FileValidationError extends Error {
    constructor(message, filename) {
        super(message);
        this.filename = filename;
        this.name = 'FileValidationError';
    }
}
export const VALIDATION_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    MAX_FILES_PER_UPLOAD: 10,
    ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    MAX_FILENAME_LENGTH: 255,
    FILENAME_PATTERN: /^[a-zA-Z0-9._-]+$/,
    MAX_ITEMS_PER_PAGE: 100,
    DEFAULT_ITEMS_PER_PAGE: 20,
    MAX_SEARCH_LENGTH: 100,
    MAX_BATCH_DELETE: 50
};
export async function validateAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('Token de acesso não fornecido');
    }
    const token = authHeader.substring(7);
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            throw new AuthenticationError('Token inválido ou expirado');
        }
        return { user, userId: user.id };
    }
    catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('Erro ao validar token de acesso');
    }
}
export function validateFile(file) {
    if (!file) {
        throw new FileValidationError('Nenhum arquivo foi enviado');
    }
    if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
        throw new FileValidationError(`Arquivo muito grande. Tamanho máximo: ${VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`, file.originalFilename || undefined);
    }
    if (file.mimetype && !VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new FileValidationError(`Tipo de arquivo não permitido: ${file.mimetype}`, file.originalFilename || undefined);
    }
    if (file.originalFilename) {
        const ext = path.extname(file.originalFilename).toLowerCase();
        if (!VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new FileValidationError(`Extensão de arquivo não permitida: ${ext}`, file.originalFilename);
        }
        if (file.originalFilename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
            throw new FileValidationError(`Nome do arquivo muito longo. Máximo: ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} caracteres`, file.originalFilename);
        }
        const filename = path.basename(file.originalFilename, ext);
        if (!VALIDATION_CONFIG.FILENAME_PATTERN.test(filename)) {
            throw new FileValidationError('Nome do arquivo contém caracteres inválidos. Use apenas letras, números, pontos, hífens e underscores', file.originalFilename);
        }
    }
}
export function validateFiles(files) {
    if (!files || files.length === 0) {
        throw new FileValidationError('Nenhum arquivo foi enviado');
    }
    if (files.length > VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD) {
        throw new FileValidationError(`Muitos arquivos. Máximo permitido: ${VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD}`);
    }
    files.forEach(file => validateFile(file));
}
export function validatePaginationParams(query) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;
    if (page < 1) {
        page = 1;
    }
    if (limit < 1) {
        limit = VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;
    }
    else if (limit > VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE) {
        limit = VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE;
    }
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
export function validateSortParams(query) {
    const allowedSortFields = ['created_at', 'updated_at', 'nome', 'tipo'];
    let sortBy = query.sortBy || 'created_at';
    let sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'created_at';
    }
    return { sortBy, sortOrder };
}
export function validateId(id, fieldName = 'id') {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw new ValidationError(`${fieldName} é obrigatório`, fieldName);
    }
    const trimmedId = id.trim();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(trimmedId)) {
        throw new ValidationError(`${fieldName} deve ser um UUID válido`, fieldName);
    }
    return trimmedId;
}
export function validateIds(ids, fieldName = 'ids') {
    let idArray;
    if (typeof ids === 'string') {
        try {
            idArray = JSON.parse(ids);
        }
        catch {
            idArray = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
        }
    }
    else if (Array.isArray(ids)) {
        idArray = ids;
    }
    else {
        throw new ValidationError(`${fieldName} deve ser um array ou string`, fieldName);
    }
    if (idArray.length === 0) {
        throw new ValidationError(`${fieldName} não pode estar vazio`, fieldName);
    }
    if (idArray.length > VALIDATION_CONFIG.MAX_BATCH_DELETE) {
        throw new ValidationError(`Muitos IDs. Máximo permitido: ${VALIDATION_CONFIG.MAX_BATCH_DELETE}`, fieldName);
    }
    return idArray.map((id, index) => {
        try {
            return validateId(id, `${fieldName}[${index}]`);
        }
        catch (error) {
            throw new ValidationError(`ID inválido na posição ${index}: ${error.message}`, fieldName);
        }
    });
}
export function validateSearchTerm(term) {
    if (!term || typeof term !== 'string') {
        return '';
    }
    const trimmedTerm = term.trim();
    if (trimmedTerm.length > VALIDATION_CONFIG.MAX_SEARCH_LENGTH) {
        throw new ValidationError(`Termo de busca muito longo. Máximo: ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`);
    }
    return trimmedTerm;
}
export function handleApiError(error, res) {
    console.error('Erro na API:', error);
    if (error instanceof ValidationError) {
        return res.status(400).json({
            success: false,
            error: error.message,
            field: error.field
        });
    }
    if (error instanceof AuthenticationError) {
        return res.status(401).json({
            success: false,
            error: error.message
        });
    }
    if (error instanceof AuthorizationError) {
        return res.status(403).json({
            success: false,
            error: error.message
        });
    }
    if (error instanceof FileValidationError) {
        return res.status(400).json({
            success: false,
            error: error.message,
            filename: error.filename
        });
    }
    return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
}
export function withErrorHandling(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        }
        catch (error) {
            handleApiError(error, res);
        }
    };
}
export function validateMethod(req, allowedMethods) {
    if (!req.method || !allowedMethods.includes(req.method)) {
        throw new ValidationError(`Método ${req.method} não permitido. Métodos permitidos: ${allowedMethods.join(', ')}`);
    }
}
export function validateContentType(req) {
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!contentType) {
            throw new ValidationError('Content-Type é obrigatório para requisições POST/PUT');
        }
        if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
            throw new ValidationError('Content-Type deve ser application/json ou multipart/form-data');
        }
    }
}
export function sanitizeFilename(filename) {
    if (!filename) {
        return `file_${Date.now()}`;
    }
    let sanitized = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
    if (sanitized.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        const maxNameLength = VALIDATION_CONFIG.MAX_FILENAME_LENGTH - ext.length;
        sanitized = name.substring(0, maxNameLength) + ext;
    }
    if (!sanitized || sanitized === '.') {
        sanitized = `file_${Date.now()}`;
    }
    return sanitized;
}
export async function validateImageOwnership(imageId, userId) {
    const { data: image, error } = await supabase
        .from('imagens_clientes')
        .select('user_id')
        .eq('id', imageId)
        .single();
    if (error || !image) {
        throw new ValidationError('Imagem não encontrada');
    }
    if (image.user_id !== userId) {
        throw new AuthorizationError('Você não tem permissão para acessar esta imagem');
    }
}
export function validateImageId(id) {
    return validateId(id, 'imageId');
}
export function validateImageIds(ids) {
    return validateIds(ids, 'imageIds');
}
