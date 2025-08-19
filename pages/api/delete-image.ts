import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { 
  withErrorHandling,
  validateAuth,
  validateMethod,
  validateImageIds,
  handleApiError
} from './middleware/validation.js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageRecord {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  created_at: string;
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
 * Remove arquivo físico do sistema
 */
async function deletePhysicalFile(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo físico:', error);
    return false;
  }
}

/**
 * Remove registro da imagem do banco
 */
async function deleteImageRecord(imageId: string, userId: string): Promise<boolean> {
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
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    return false;
  }
}

/**
 * Atualiza estatísticas do diretório
 */
async function updateDirectoryStats(userId: string): Promise<void> {
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
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}

/**
 * Deleta múltiplas imagens
 */
async function deleteMultipleImages(imageIds: string[], userId: string): Promise<{
  success: string[];
  failed: string[];
  errors: { [key: string]: string };
}> {
  const results = {
    success: [] as string[],
    failed: [] as string[],
    errors: {} as { [key: string]: string }
  };

  for (const imageId of imageIds) {
    try {
      // Buscar informações da imagem
      const imageRecord = await getImageRecord(imageId, userId);
      if (!imageRecord) {
        results.failed.push(imageId);
        results.errors[imageId] = 'Imagem não encontrada';
        continue;
      }

      // Deletar arquivo físico
      const fileDeleted = await deletePhysicalFile(imageRecord.file_path);
      
      // Deletar registro do banco (mesmo se o arquivo físico falhou)
      const recordDeleted = await deleteImageRecord(imageId, userId);

      if (recordDeleted) {
        results.success.push(imageId);
        if (!fileDeleted) {
          results.errors[imageId] = 'Registro removido, mas arquivo físico não foi encontrado';
        }
      } else {
        results.failed.push(imageId);
        results.errors[imageId] = 'Falha ao remover registro do banco';
      }
    } catch (error) {
      results.failed.push(imageId);
      results.errors[imageId] = error instanceof Error ? error.message : 'Erro desconhecido';
    }
  }

  return results;
}

/**
 * Handler principal da API
 */
const deleteHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validar método HTTP
  validateMethod(req, ['DELETE']);
  
  // Validar autenticação
  const { user, userId } = await validateAuth(req);

  // Extrair e validar IDs das imagens
  const { imageIds } = req.body;
  
  // Validar IDs das imagens
  const validatedIds = validateImageIds(imageIds);

  // Deletar imagens
  const results = await deleteMultipleImages(validatedIds, userId);

  // Atualizar estatísticas se houve sucesso
  if (results.success.length > 0) {
    await updateDirectoryStats(userId);
  }

  // Determinar status da resposta
  let statusCode = 200;
  if (results.success.length === 0) {
    statusCode = 400; // Nenhuma imagem foi deletada
  } else if (results.failed.length > 0) {
    statusCode = 207; // Sucesso parcial
  }

  // Resposta
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