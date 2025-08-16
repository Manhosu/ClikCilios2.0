import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tipos de erro
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Usuário não autenticado') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Acesso negado') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class FileValidationError extends Error {
  constructor(message: string, public filename?: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

// Configurações de validação
export const VALIDATION_CONFIG = {
  // Arquivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
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
  
  // Nomes de arquivo
  MAX_FILENAME_LENGTH: 255,
  FILENAME_PATTERN: /^[a-zA-Z0-9._-]+$/,
  
  // Paginação
  MAX_ITEMS_PER_PAGE: 100,
  DEFAULT_ITEMS_PER_PAGE: 20,
  
  // Busca
  MAX_SEARCH_LENGTH: 100,
  
  // Batch operations
  MAX_BATCH_DELETE: 50
};

// Middleware de autenticação
export async function validateAuth(req: NextApiRequest): Promise<{ user: any; userId: string }> {
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
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Erro ao validar autenticação');
  }
}

// Validação de arquivos
export function validateFile(file: formidable.File): void {
  // Validar tamanho
  if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
    throw new FileValidationError(
      `Arquivo muito grande. Tamanho máximo: ${VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      file.originalFilename || 'unknown'
    );
  }
  
  // Validar tipo MIME
  if (!file.mimetype || !VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new FileValidationError(
      `Tipo de arquivo não permitido. Tipos aceitos: ${VALIDATION_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`,
      file.originalFilename || 'unknown'
    );
  }
  
  // Validar extensão
  const filename = file.originalFilename || '';
  const ext = path.extname(filename).toLowerCase();
  
  if (!VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    throw new FileValidationError(
      `Extensão de arquivo não permitida. Extensões aceitas: ${VALIDATION_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
      filename
    );
  }
  
  // Validar nome do arquivo
  if (filename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    throw new FileValidationError(
      `Nome do arquivo muito longo. Máximo: ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} caracteres`,
      filename
    );
  }
  
  // Validar caracteres do nome
  const nameWithoutExt = path.basename(filename, ext);
  if (!VALIDATION_CONFIG.FILENAME_PATTERN.test(nameWithoutExt)) {
    throw new FileValidationError(
      'Nome do arquivo contém caracteres inválidos. Use apenas letras, números, pontos, hífens e underscores',
      filename
    );
  }
  
  // Verificar se o arquivo não está vazio
  if (file.size === 0) {
    throw new FileValidationError(
      'Arquivo está vazio',
      filename
    );
  }
}

// Validação de múltiplos arquivos
export function validateFiles(files: formidable.File[]): void {
  if (files.length === 0) {
    throw new ValidationError('Nenhum arquivo fornecido');
  }
  
  if (files.length > VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD) {
    throw new ValidationError(
      `Muitos arquivos. Máximo permitido: ${VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD}`
    );
  }
  
  // Validar cada arquivo
  files.forEach(file => validateFile(file));
  
  // Verificar nomes duplicados
  const filenames = files.map(f => f.originalFilename).filter(Boolean);
  const uniqueFilenames = new Set(filenames);
  
  if (filenames.length !== uniqueFilenames.size) {
    throw new ValidationError('Arquivos com nomes duplicados não são permitidos');
  }
}

// Validação de parâmetros de paginação
export function validatePaginationParams(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;
  
  // Validar página
  if (page < 1) {
    throw new ValidationError('Número da página deve ser maior que 0', 'page');
  }
  
  // Validar limite
  if (limit < 1) {
    throw new ValidationError('Limite deve ser maior que 0', 'limit');
  }
  
  if (limit > VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE) {
    throw new ValidationError(
      `Limite muito alto. Máximo permitido: ${VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE}`,
      'limit'
    );
  }
  
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Validação de parâmetros de ordenação
export function validateSortParams(query: any): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
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
    throw new ValidationError(
      `Campo de ordenação inválido. Campos permitidos: ${allowedSortFields.join(', ')}`,
      'sortBy'
    );
  }
  
  return { sortBy, sortOrder };
}

// Validação de IDs
export function validateId(id: string, fieldName: string = 'id'): string {
  if (!id || typeof id !== 'string') {
    throw new ValidationError(`${fieldName} é obrigatório`, fieldName);
  }
  
  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`${fieldName} deve ser um UUID válido`, fieldName);
  }
  
  return id;
}

// Validação de array de IDs
export function validateIds(ids: string | string[], fieldName: string = 'ids'): string[] {
  let idArray: string[];
  
  if (typeof ids === 'string') {
    idArray = [ids];
  } else if (Array.isArray(ids)) {
    idArray = ids;
  } else {
    throw new ValidationError(`${fieldName} deve ser um ID ou array de IDs`, fieldName);
  }
  
  if (idArray.length === 0) {
    throw new ValidationError(`${fieldName} não pode estar vazio`, fieldName);
  }
  
  if (idArray.length > VALIDATION_CONFIG.MAX_BATCH_DELETE) {
    throw new ValidationError(
      `Muitos IDs. Máximo permitido: ${VALIDATION_CONFIG.MAX_BATCH_DELETE}`,
      fieldName
    );
  }
  
  // Validar cada ID
  return idArray.map((id, index) => {
    try {
      return validateId(id, `${fieldName}[${index}]`);
    } catch (error) {
      throw new ValidationError(
        `ID inválido na posição ${index}: ${(error as Error).message}`,
        fieldName
      );
    }
  });
}

// Validação de termo de busca
export function validateSearchTerm(term: string): string {
  if (!term || typeof term !== 'string') {
    return '';
  }
  
  const trimmed = term.trim();
  
  if (trimmed.length > VALIDATION_CONFIG.MAX_SEARCH_LENGTH) {
    throw new ValidationError(
      `Termo de busca muito longo. Máximo: ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
      'search'
    );
  }
  
  return trimmed;
}

// Middleware de tratamento de erros
export function handleApiError(error: any, res: NextApiResponse) {
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
  
  // Erro genérico
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    type: 'internal_error'
  });
}

// Wrapper para endpoints com tratamento de erro
export function withErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, res);
    }
  };
}

// Validação de método HTTP
export function validateMethod(req: NextApiRequest, allowedMethods: string[]): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    throw new ValidationError(
      `Método ${req.method} não permitido. Métodos aceitos: ${allowedMethods.join(', ')}`
    );
  }
}

// Validação de Content-Type para uploads
export function validateContentType(req: NextApiRequest): void {
  const contentType = req.headers['content-type'];
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new ValidationError(
      'Content-Type deve ser multipart/form-data para upload de arquivos'
    );
  }
}

// Sanitização de nome de arquivo
export function sanitizeFilename(filename: string): string {
  // Remover caracteres perigosos
  let sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Garantir que não está vazio
  if (!sanitized) {
    sanitized = 'file';
  }
  
  // Limitar tamanho
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 100 - ext.length) + ext;
  }
  
  return sanitized;
}

// Validação de propriedade de imagem
export async function validateImageOwnership(
  imageId: string, 
  userId: string
): Promise<void> {
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