import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import mimeTypes from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { 
  withErrorHandling,
  validateAuth,
  validateMethod,
  validateContentType,
  validateFiles,
  sanitizeFilename,
  handleApiError
} from '../src/middleware/validation';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurações
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const UPLOAD_DIR = './minhas-imagens';

// Desabilitar o parser padrão do Next.js para lidar com multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ImageMetadata {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
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
 * Cria diretório do usuário se não existir
 */
async function ensureUserDirectory(userId: string): Promise<string> {
  const userDir = path.join(UPLOAD_DIR, userId);
  
  try {
    await fs.access(userDir);
  } catch {
    await fs.mkdir(userDir, { recursive: true });
  }
  
  return userDir;
}

/**
 * Registra diretório no banco de dados
 */
async function registerUserDirectory(userId: string, directoryPath: string): Promise<void> {
  try {
    const { data: existingDir } = await supabase
      .from('user_image_directories')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingDir) {
      await supabase
        .from('user_image_directories')
        .update({ 
          directory_path: directoryPath,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_image_directories')
        .insert({
          user_id: userId,
          directory_path: directoryPath,
          total_images: 0,
          total_size: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Erro ao registrar diretório:', error);
    throw error;
  }
}

/**
 * Salva metadados da imagem no banco
 */
async function saveImageMetadata(metadata: ImageMetadata): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_images')
      .insert(metadata);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao salvar metadados:', error);
    throw error;
  }
}

/**
 * Atualiza estatísticas do diretório
 */
async function updateDirectoryStats(userId: string): Promise<void> {
  try {
    const { data: images } = await supabase
      .from('user_images')
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
 * Handler principal da API
 */
const uploadHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Validar método HTTP
  validateMethod(req, ['POST']);
  
  // Validar Content-Type
  validateContentType(req);
  
  // Validar autenticação
  const { user, userId } = await validateAuth(req);

  try {

    // Configurar formidable
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // Será validado pelo middleware
      maxFiles: 20, // Será validado pelo middleware
      multiples: true
    });

    // Parse do formulário
    const [fields, files] = await form.parse(req);
    
    // Verificar se há arquivos
    const uploadedFiles = files.images;
    if (!uploadedFiles) {
      throw new ValidationError('Nenhum arquivo fornecido');
    }

    const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
    
    // Validar arquivos
    validateFiles(fileArray);

    // Garantir diretório do usuário
    const userDir = await ensureUserDirectory(userId);
    await registerUserDirectory(userId, userDir);
    
    const uploadResults = [];
    
    // Processar cada arquivo
    for (const file of fileArray) {
      // Gerar nome único para o arquivo
      const fileExtension = path.extname(file.originalFilename || '');
      const sanitizedName = sanitizeFilename(file.originalFilename || 'image');
      const uniqueFilename = `${uuidv4()}_${Date.now()}_${sanitizedName}${fileExtension}`;
      const finalPath = path.join(userDir, uniqueFilename);

      try {
        // Mover arquivo para o destino final
        await fs.copyFile(file.filepath, finalPath);
        await fs.unlink(file.filepath); // Remover arquivo temporário

        // Criar metadados
        const imageMetadata: ImageMetadata = {
          id: uuidv4(),
          user_id: userId,
          filename: uniqueFilename,
          original_name: file.originalFilename || 'unknown',
          file_path: finalPath,
          file_size: file.size,
          mime_type: file.mimetype || 'application/octet-stream',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Salvar metadados no banco
        await saveImageMetadata(imageMetadata);

        uploadResults.push({
          success: true,
          id: imageMetadata.id,
          filename: uniqueFilename,
          originalFilename: file.originalFilename,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: imageMetadata.created_at
        });

      } catch (fileError) {
        uploadResults.push({
          success: false,
          filename: file.originalFilename,
          error: fileError instanceof Error ? fileError.message : 'Erro desconhecido'
        });
      }
    }

    // Atualizar estatísticas do diretório
    await updateDirectoryStats(userId);

    const successCount = uploadResults.filter(r => r.success).length;
    const totalCount = uploadResults.length;

    // Resposta de sucesso
    res.status(200).json({
      success: successCount > 0,
      message: successCount === totalCount 
        ? `${successCount} imagem(ns) enviada(s) com sucesso`
        : `${successCount} de ${totalCount} imagem(ns) enviada(s) com sucesso`,
      data: {
        results: uploadResults,
        summary: {
          total: totalCount,
          success: successCount,
          failed: totalCount - successCount
        }
      }
    });

  } catch (error) {
    return handleApiError(res, error);
  }
};

export default withErrorHandling(uploadHandler);