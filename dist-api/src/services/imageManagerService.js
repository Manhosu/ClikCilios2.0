import { supabase } from '../lib/supabase';
import { generateId } from '../utils/generateId';
import path from 'path';
import fs from 'fs/promises';
class ImageManagerService {
    constructor() {
        this.baseImagePath = './minhas-imagens';
        this.maxFileSize = 10 * 1024 * 1024;
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif'
        ];
    }
    async createUserDirectory(userId) {
        try {
            const userDirPath = path.join(this.baseImagePath, userId);
            try {
                await fs.access(userDirPath);
                console.log(`Diretório já existe para usuário: ${userId}`);
            }
            catch {
                await fs.mkdir(userDirPath, { recursive: true });
                console.log(`Diretório criado para usuário: ${userId}`);
            }
            await this.registerUserDirectory(userId, userDirPath);
            return userDirPath;
        }
        catch (error) {
            console.error('Erro ao criar diretório do usuário:', error);
            throw new Error(`Falha ao criar diretório para usuário ${userId}`);
        }
    }
    async registerUserDirectory(userId, directoryPath) {
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
            }
            else {
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
        }
        catch (error) {
            console.error('Erro ao registrar diretório no banco:', error);
            throw error;
        }
    }
    validateImageFile(file) {
        if (file.size > this.maxFileSize) {
            throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`);
        }
        if (!this.allowedMimeTypes.includes(file.type)) {
            throw new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${this.allowedMimeTypes.join(', ')}`);
        }
    }
    async saveUserImage(userId, file) {
        try {
            this.validateImageFile(file);
            const userDirPath = await this.createUserDirectory(userId);
            const fileExtension = path.extname(file.name);
            const uniqueFilename = `${generateId()}_${Date.now()}${fileExtension}`;
            const filePath = path.join(userDirPath, uniqueFilename);
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(filePath, buffer);
            const dimensions = await this.getImageDimensions(buffer, file.type);
            const imageMetadata = {
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
            await this.saveImageMetadata(imageMetadata);
            await this.updateDirectoryStats(userId);
            return imageMetadata;
        }
        catch (error) {
            console.error('Erro ao salvar imagem:', error);
            throw error;
        }
    }
    async getImageDimensions(_buffer, _mimeType) {
        try {
            return null;
        }
        catch {
            return null;
        }
    }
    async saveImageMetadata(metadata) {
        try {
            const { error } = await supabase
                .from('user_images')
                .insert(metadata);
            if (error) {
                throw error;
            }
        }
        catch (error) {
            console.error('Erro ao salvar metadados da imagem:', error);
            throw error;
        }
    }
    async updateDirectoryStats(userId) {
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
        }
        catch (error) {
            console.error('Erro ao atualizar estatísticas do diretório:', error);
        }
    }
    async getUserImages(userId) {
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
        }
        catch (error) {
            console.error('Erro ao buscar imagens do usuário:', error);
            throw error;
        }
    }
    async deleteUserImage(userId, imageId) {
        try {
            const { data: image, error: fetchError } = await supabase
                .from('user_images')
                .select('*')
                .eq('id', imageId)
                .eq('user_id', userId)
                .single();
            if (fetchError || !image) {
                throw new Error('Imagem não encontrada');
            }
            try {
                await fs.unlink(image.file_path);
            }
            catch (fileError) {
                console.warn('Arquivo físico não encontrado:', image.file_path);
            }
            const { error: deleteError } = await supabase
                .from('user_images')
                .delete()
                .eq('id', imageId)
                .eq('user_id', userId);
            if (deleteError) {
                throw deleteError;
            }
            await this.updateDirectoryStats(userId);
        }
        catch (error) {
            console.error('Erro ao deletar imagem:', error);
            throw error;
        }
    }
    async getUserDirectoryStats(userId) {
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
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas do diretório:', error);
            return null;
        }
    }
    async clearUserDirectory(userId) {
        try {
            const images = await this.getUserImages(userId);
            for (const image of images) {
                await this.deleteUserImage(userId, image.id);
            }
            console.log(`Diretório do usuário ${userId} limpo com sucesso`);
        }
        catch (error) {
            console.error('Erro ao limpar diretório do usuário:', error);
            throw error;
        }
    }
}
export const imageManagerService = new ImageManagerService();
export default imageManagerService;
