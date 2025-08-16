import { supabase } from '../lib/supabase';
import { generateId } from '../utils/generateId';
import path from 'path';
import fs from 'fs/promises';

export interface ImageMetadata {
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

export interface UserImageDirectory {
  user_id: string;
  directory_path: string;
  total_images: number;
  total_size: number;
  created_at: string;
  updated_at: string;
}

class ImageManagerService {
  private readonly baseImagePath = './minhas-imagens';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  /**
   * Cria diretório dedicado para um usuário
   */
  async createUserDirectory(userId: string): Promise<string> {
    try {
      const userDirPath = path.join(this.baseImagePath, userId);
      
      // Verifica se o diretório já existe
      try {
        await fs.access(userDirPath);
        console.log(`Diretório já existe para usuário: ${userId}`);
      } catch {
        // Diretório não existe, criar
        await fs.mkdir(userDirPath, { recursive: true });
        console.log(`Diretório criado para usuário: ${userId}`);
      }

      // Registra ou atualiza no banco de dados
      await this.registerUserDirectory(userId, userDirPath);
      
      return userDirPath;
    } catch (error) {
      console.error('Erro ao criar diretório do usuário:', error);
      throw new Error(`Falha ao criar diretório para usuário ${userId}`);
    }
  }

  /**
   * Registra diretório do usuário no banco de dados
   */
  private async registerUserDirectory(userId: string, directoryPath: string): Promise<void> {
    try {
      const { data: existingDir } = await supabase
        .from('user_image_directories')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingDir) {
        // Atualiza registro existente
        await supabase
          .from('user_image_directories')
          .update({ 
            directory_path: directoryPath,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Cria novo registro
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
      console.error('Erro ao registrar diretório no banco:', error);
      throw error;
    }
  }

  /**
   * Valida arquivo de imagem
   */
  private validateImageFile(file: File): void {
    // Validar tamanho
    if (file.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${this.allowedMimeTypes.join(', ')}`);
    }
  }

  /**
   * Salva imagem no diretório do usuário
   */
  async saveUserImage(userId: string, file: File): Promise<ImageMetadata> {
    try {
      // Validar arquivo
      this.validateImageFile(file);

      // Garantir que o diretório do usuário existe
      const userDirPath = await this.createUserDirectory(userId);

      // Gerar nome único para o arquivo
      const fileExtension = path.extname(file.name);
      const uniqueFilename = `${generateId()}_${Date.now()}${fileExtension}`;
      const filePath = path.join(userDirPath, uniqueFilename);

      // Converter File para Buffer e salvar
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, buffer);

      // Obter dimensões da imagem (se possível)
      const dimensions = await this.getImageDimensions(buffer, file.type);

      // Criar metadados
      const imageMetadata: ImageMetadata = {
        id: generateId(),
        user_id: userId,
        filename: uniqueFilename,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Salvar metadados no banco
      await this.saveImageMetadata(imageMetadata);

      // Atualizar estatísticas do diretório
      await this.updateDirectoryStats(userId);

      return imageMetadata;
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      throw error;
    }
  }

  /**
   * Obtém dimensões da imagem (implementação básica)
   */
  private async getImageDimensions(_buffer: Buffer, _mimeType: string): Promise<{ width: number; height: number } | null> {
    try {
      // Esta é uma implementação básica
      // Em produção, você pode usar bibliotecas como 'sharp' ou 'jimp'
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Salva metadados da imagem no banco
   */
  private async saveImageMetadata(metadata: ImageMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_images')
        .insert(metadata);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar metadados da imagem:', error);
      throw error;
    }
  }

  /**
   * Atualiza estatísticas do diretório do usuário
   */
  private async updateDirectoryStats(userId: string): Promise<void> {
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
      console.error('Erro ao atualizar estatísticas do diretório:', error);
    }
  }

  /**
   * Lista imagens de um usuário
   */
  async getUserImages(userId: string): Promise<ImageMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar imagens do usuário:', error);
      throw error;
    }
  }

  /**
   * Remove imagem do usuário
   */
  async deleteUserImage(userId: string, imageId: string): Promise<void> {
    try {
      // Buscar metadados da imagem
      const { data: image, error: fetchError } = await supabase
        .from('user_images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !image) {
        throw new Error('Imagem não encontrada');
      }

      // Remover arquivo físico
      try {
        await fs.unlink(image.file_path);
      } catch (fileError) {
        console.warn('Arquivo físico não encontrado:', image.file_path);
      }

      // Remover do banco de dados
      const { error: deleteError } = await supabase
        .from('user_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Atualizar estatísticas
      await this.updateDirectoryStats(userId);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do diretório do usuário
   */
  async getUserDirectoryStats(userId: string): Promise<UserImageDirectory | null> {
    try {
      const { data, error } = await supabase
        .from('user_image_directories')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do diretório:', error);
      return null;
    }
  }

  /**
   * Limpa diretório do usuário (remove todas as imagens)
   */
  async clearUserDirectory(userId: string): Promise<void> {
    try {
      // Buscar todas as imagens do usuário
      const images = await this.getUserImages(userId);

      // Remover cada imagem
      for (const image of images) {
        await this.deleteUserImage(userId, image.id);
      }

      console.log(`Diretório do usuário ${userId} limpo com sucesso`);
    } catch (error) {
      console.error('Erro ao limpar diretório do usuário:', error);
      throw error;
    }
  }
}

export const imageManagerService = new ImageManagerService();
export default imageManagerService;