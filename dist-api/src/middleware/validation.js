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
        throw new AuthenticationError('Token de autenticação não fornecido');
    }
    const token = authHeader.substring(7);
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            throw new AuthenticationError('Token de autenticação inválido');
        }
        return { user, userId: user.id };
    }
    catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('Erro ao validar autenticação');
    }
}
export function validateFile(file) {
    if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
        throw new FileValidationError(`Arquivo muito grande. Tamanho máximo: ${VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`, file.originalFilename || 'unknown');
    }
    if (!file.mimetype || !VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new FileValidationError(`Tipo de arquivo não permitido. Tipos aceitos: ${VALIDATION_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`, file.originalFilename || 'unknown');
    }
    const filename = file.originalFilename || '';
    const ext = path.extname(filename).toLowerCase();
    if (!VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        throw new FileValidationError(`Extensão de arquivo não permitida. Extensões aceitas: ${VALIDATION_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`, filename);
    }
    if (filename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
        throw new FileValidationError(`Nome do arquivo muito longo. Máximo: ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} caracteres`, filename);
    }
    const nameWithoutExt = path.basename(filename, ext);
    if (!VALIDATION_CONFIG.FILENAME_PATTERN.test(nameWithoutExt)) {
        throw new FileValidationError('Nome do arquivo contém caracteres inválidos. Use apenas letras, números, pontos, hífens e underscores', filename);
    }
    if (file.size === 0) {
        throw new FileValidationError('Arquivo está vazio', filename);
    }
}
export function validateFiles(files) {
    if (files.length === 0) {
        throw new ValidationError('Nenhum arquivo fornecido');
    }
    if (files.length > VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD) {
        throw new ValidationError(`Muitos arquivos. Máximo permitido: ${VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD}`);
    }
    files.forEach(file => validateFile(file));
    const filenames = files.map(f => f.originalFilename).filter(Boolean);
    const uniqueFilenames = new Set(filenames);
    if (filenames.length !== uniqueFilenames.size) {
        throw new ValidationError('Arquivos com nomes duplicados não são permitidos');
    }
}
export function validatePaginationParams(query) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;
    if (page < 1) {
        throw new ValidationError('Número da página deve ser maior que 0', 'page');
    }
    if (limit < 1) {
        throw new ValidationError('Limite deve ser maior que 0', 'limit');
    }
    if (limit > VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE) {
        throw new ValidationError(`Limite muito alto. Máximo permitido: ${VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE}`, 'limit');
    }
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
export function validateSortParams(query) {
    const allowedSortFields = [
        'created_at',
        'updated_at',
        'filename',
        'original_name',
        'file_size',
        'mime_type'
    ];
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (!allowedSortFields.includes(sortBy)) {
        throw new ValidationError(`Campo de ordenação inválido. Campos permitidos: ${allowedSortFields.join(', ')}`, 'sortBy');
    }
    return { sortBy, sortOrder };
}
export function validateId(id, fieldName = 'id') {
    if (!id || typeof id !== 'string') {
        throw new ValidationError(`${fieldName} é obrigatório`, fieldName);
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        throw new ValidationError(`${fieldName} deve ser um UUID válido`, fieldName);
    }
    return id;
}
export function validateIds(ids, fieldName = 'ids') {
    let idArray;
    if (typeof ids === 'string') {
        idArray = [ids];
    }
    else if (Array.isArray(ids)) {
        idArray = ids;
    }
    else {
        throw new ValidationError(`${fieldName} deve ser um ID ou array de IDs`, fieldName);
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
    const trimmed = term.trim();
    if (trimmed.length > VALIDATION_CONFIG.MAX_SEARCH_LENGTH) {
        throw new ValidationError(`Termo de busca muito longo. Máximo: ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`, 'search');
    }
    return trimmed;
}
export function handleApiError(error, res) {
    console.error('API Error:', error);
    if (error instanceof ValidationError) {
        return res.status(400).json({
            success: false,
            message: error.message,
            field: error.field,
            type: 'validation_error'
        });
    }
    if (error instanceof AuthenticationError) {
        return res.status(401).json({
            success: false,
            message: error.message,
            type: 'authentication_error'
        });
    }
    if (error instanceof AuthorizationError) {
        return res.status(403).json({
            success: false,
            message: error.message,
            type: 'authorization_error'
        });
    }
    if (error instanceof FileValidationError) {
        return res.status(400).json({
            success: false,
            message: error.message,
            filename: error.filename,
            type: 'file_validation_error'
        });
    }
    return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        type: 'internal_error'
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
        throw new ValidationError(`Método ${req.method} não permitido. Métodos aceitos: ${allowedMethods.join(', ')}`);
    }
}
export function validateContentType(req) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new ValidationError('Content-Type deve ser multipart/form-data para upload de arquivos');
    }
}
export function sanitizeFilename(filename) {
    let sanitized = filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '');
    if (!sanitized) {
        sanitized = 'file';
    }
    if (sanitized.length > 100) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        sanitized = name.substring(0, 100 - ext.length) + ext;
    }
    return sanitized;
}
export async function validateImageOwnership(imageId, userId) {
    const { data: image, error } = await supabase
        .from('user_images')
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
