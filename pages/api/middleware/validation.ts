import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
  
  // Operações em lote
  MAX_BATCH_DELETE: 50
};

// Função para validar autenticação
export async function validateAuth(req: NextApiRequest): Promise<{ user: any; userId: string }> {
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
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Erro ao validar token de acesso');
  }
}

// Função para validar arquivo único
export function validateFile(file: formidable.File): void {
  // Verificar se o arquivo existe
  if (!file) {
    throw new FileValidationError('Nenhum arquivo foi enviado');
  }

  // Verificar tamanho do arquivo
  if (file.size > VALIDATION_CONFIG.MAX_FILE_SIZE) {
    throw new FileValidationError(
      `Arquivo muito grande. Tamanho máximo: ${VALIDATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      file.originalFilename || undefined
    );
  }

  // Verificar tipo MIME
  if (file.mimetype && !VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new FileValidationError(
      `Tipo de arquivo não permitido: ${file.mimetype}`,
      file.originalFilename || undefined
    );
  }

  // Verificar extensão do arquivo
  if (file.originalFilename) {
    const ext = path.extname(file.originalFilename).toLowerCase();
    if (!VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new FileValidationError(
        `Extensão de arquivo não permitida: ${ext}`,
        file.originalFilename
      );
    }

    // Verificar comprimento do nome do arquivo
    if (file.originalFilename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
      throw new FileValidationError(
        `Nome do arquivo muito longo. Máximo: ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} caracteres`,
        file.originalFilename
      );
    }

    // Verificar padrão do nome do arquivo
    const filename = path.basename(file.originalFilename, ext);
    if (!VALIDATION_CONFIG.FILENAME_PATTERN.test(filename)) {
      throw new FileValidationError(
        'Nome do arquivo contém caracteres inválidos. Use apenas letras, números, pontos, hífens e underscores',
        file.originalFilename
      );
    }
  }
}

// Função para validar múltiplos arquivos
export function validateFiles(files: formidable.File[]): void {
  if (!files || files.length === 0) {
    throw new FileValidationError('Nenhum arquivo foi enviado');
  }

  if (files.length > VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD) {
    throw new FileValidationError(
      `Muitos arquivos. Máximo permitido: ${VALIDATION_CONFIG.MAX_FILES_PER_UPLOAD}`
    );
  }

  // Validar cada arquivo individualmente
  files.forEach(file => validateFile(file));
}

// Função para validar parâmetros de paginação
export function validatePaginationParams(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;

  // Validar página
  if (page < 1) {
    page = 1;
  }

  // Validar limite
  if (limit < 1) {
    limit = VALIDATION_CONFIG.DEFAULT_ITEMS_PER_PAGE;
  } else if (limit > VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE) {
    limit = VALIDATION_CONFIG.MAX_ITEMS_PER_PAGE;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Função para validar parâmetros de ordenação
export function validateSortParams(query: any): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const allowedSortFields = ['created_at', 'updated_at', 'nome', 'tipo'];
  let sortBy = query.sortBy || 'created_at';
  let sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

  // Validar campo de ordenação
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = 'created_at';
  }

  return { sortBy, sortOrder };
}

// Função para validar ID único
export function validateId(id: string, fieldName: string = 'id'): string {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new ValidationError(`${fieldName} é obrigatório`, fieldName);
  }

  const trimmedId = id.trim();
  
  // Validar formato UUID (básico)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(trimmedId)) {
    throw new ValidationError(`${fieldName} deve ser um UUID válido`, fieldName);
  }

  return trimmedId;
}

// Função para validar múltiplos IDs
export function validateIds(ids: string | string[], fieldName: string = 'ids'): string[] {
  let idArray: string[];
  
  if (typeof ids === 'string') {
    // Se for uma string, tentar fazer parse como JSON ou dividir por vírgula
    try {
      idArray = JSON.parse(ids);
    } catch {
      idArray = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);
    }
  } else if (Array.isArray(ids)) {
    idArray = ids;
  } else {
    throw new ValidationError(`${fieldName} deve ser um array ou string`, fieldName);
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

  // Validar cada ID individualmente
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

// Função para validar termo de busca
export function validateSearchTerm(term: string): string {
  if (!term || typeof term !== 'string') {
    return '';
  }

  const trimmedTerm = term.trim();
  
  if (trimmedTerm.length > VALIDATION_CONFIG.MAX_SEARCH_LENGTH) {
    throw new ValidationError(
      `Termo de busca muito longo. Máximo: ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`
    );
  }

  return trimmedTerm;
}

// Função para tratar erros da API
export function handleApiError(error: any, res: NextApiResponse) {
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

  // Erro genérico
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
}

// Wrapper para tratamento de erros
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

// Função para validar método HTTP
export function validateMethod(req: NextApiRequest, allowedMethods: string[]): void {
  if (!req.method || !allowedMethods.includes(req.method)) {
    throw new ValidationError(`Método ${req.method} não permitido. Métodos permitidos: ${allowedMethods.join(', ')}`);
  }
}

// Função para validar Content-Type
export function validateContentType(req: NextApiRequest): void {
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

// Função para sanitizar nome de arquivo
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    return `file_${Date.now()}`;
  }

  // Remover caracteres perigosos
  let sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  // Garantir que não seja muito longo
  if (sanitized.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const maxNameLength = VALIDATION_CONFIG.MAX_FILENAME_LENGTH - ext.length;
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  // Garantir que não seja vazio
  if (!sanitized || sanitized === '.') {
    sanitized = `file_${Date.now()}`;
  }

  return sanitized;
}

// Função para validar propriedade de imagem
export async function validateImageOwnership(
  imageId: string, 
  userId: string
): Promise<void> {
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

// Função para validar ID de imagem
export function validateImageId(id: string): string {
  return validateId(id, 'imageId');
}

// Função para validar IDs de imagens
export function validateImageIds(ids: string | string[]): string[] {
  return validateIds(ids, 'imageIds');
}