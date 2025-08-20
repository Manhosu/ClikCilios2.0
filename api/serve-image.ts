import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { 
  withErrorHandling,
  validateAuth,
  validateMethod,
  validateImageId,
  handleApiError
} from './middleware/validation';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageRecord {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  created_at: string;
}

// Função validateAuth removida - usando a do middleware

/**
 * Busca informações da imagem
 */
async function getImageRecord(imageId: string, userId: string): Promise<ImageRecord | null> {
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
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return null;
  }
}

/**
 * Verifica se o arquivo existe fisicamente
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gera headers de cache otimizados
 */
function setCacheHeaders(res: NextApiResponse, mimeType: string): void {
  // Cache por 1 hora para imagens
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', mimeType);
  
  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

/**
 * Processa parâmetros de redimensionamento
 */
function parseResizeParams(query: any): { width?: number; height?: number; quality?: number } {
  const width = query.w ? parseInt(query.w as string) : undefined;
  const height = query.h ? parseInt(query.h as string) : undefined;
  const quality = query.q ? Math.min(100, Math.max(1, parseInt(query.q as string))) : undefined;

  return {
    width: width && width > 0 && width <= 2000 ? width : undefined,
    height: height && height > 0 && height <= 2000 ? height : undefined,
    quality: quality || 85
  };
}

/**
 * Handler principal da API
 */
const serveHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validar método HTTP
  validateMethod(req, ['GET']);
  
  // Validar autenticação
  const authResult = await validateAuth(req);
  if (!authResult || !authResult.userId) {
    throw new Error('Falha na autenticação');
  }
  const { user, userId } = authResult;

  // Extrair e validar ID da imagem
  const { imageId } = req.query;
  
  // Validar ID da imagem
  const validatedImageId = validateImageId(imageId as string);

    // Buscar informações da imagem
    const imageRecord = await getImageRecord(validatedImageId, userId);
    if (!imageRecord) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // Verificar se o arquivo existe
    const exists = await fileExists(imageRecord.file_path);
    if (!exists) {
      return res.status(404).json({ 
        error: 'Arquivo físico não encontrado',
        details: 'A imagem existe no banco de dados mas o arquivo físico não foi encontrado'
      });
    }

    // Processar parâmetros de redimensionamento (para futuras implementações)
    const resizeParams = parseResizeParams(req.query);

    // Determinar tipo MIME
    const mimeType = imageRecord.mime_type || mime.lookup(imageRecord.file_path) || 'application/octet-stream';

    // Configurar headers
    setCacheHeaders(res, mimeType);
    
    // Headers adicionais
    res.setHeader('Content-Length', imageRecord.file_size);
    res.setHeader('Content-Disposition', `inline; filename="${imageRecord.filename}"`);
    
    // Se há dimensões, adicionar aos headers
    if (imageRecord.width && imageRecord.height) {
      res.setHeader('X-Image-Width', imageRecord.width.toString());
      res.setHeader('X-Image-Height', imageRecord.height.toString());
    }

    // Ler e enviar o arquivo
    const fileBuffer = await fs.readFile(imageRecord.file_path);
    
    // TODO: Implementar redimensionamento se necessário
    // if (resizeParams.width || resizeParams.height) {
    //   const resizedBuffer = await resizeImage(fileBuffer, resizeParams);
    //   return res.send(resizedBuffer);
    // }
    
    res.send(fileBuffer);
};

export default withErrorHandling(serveHandler);

// Configuração para permitir responses maiores
export const config = {
  api: {
    responseLimit: '10mb',
  },
};