import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
export async function uploadImageToSupabase(file, userId) {
    if (!userId) {
        throw new Error('O ID do usuário é necessário para o upload.');
    }
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
        .from('mcp')
        .upload(filePath, file);
    if (error) {
        console.error('Erro no upload para o Supabase Storage:', error);
        throw new Error(`Falha no upload da imagem: ${error.message}`);
    }
    const { data: { publicUrl } } = supabase.storage
        .from('mcp')
        .getPublicUrl(data.path);
    if (!publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
    }
    return publicUrl;
}
async function getAuthToken() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    }
    catch (error) {
        console.error('Erro ao obter token:', error);
        return null;
    }
}
export async function listImages({ page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder
        });
        const response = await fetch(`/api/list-images?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Falha ao listar imagens');
        }
        return result.data;
    }
    catch (error) {
        console.error('Erro ao listar imagens:', error);
        throw error instanceof Error ? error : new Error('Erro desconhecido ao listar imagens');
    }
}
export async function deleteImages(imageIds) {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }
        const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
        const params = new URLSearchParams();
        if (ids.length === 1) {
            params.append('imageId', ids[0]);
        }
        else {
            params.append('imageIds', JSON.stringify(ids));
        }
        const response = await fetch(`/api/delete-image?${params}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error('Erro ao deletar imagens:', error);
        throw error instanceof Error ? error : new Error('Erro desconhecido ao deletar imagens');
    }
}
export function getImageUrl(imageId) {
    return `/api/serve-image?imageId=${encodeURIComponent(imageId)}`;
}
export function getImageUrlWithParams(imageId, params) {
    const url = new URL(`/api/serve-image`, window.location.origin);
    url.searchParams.set('imageId', imageId);
    if (params?.width) {
        url.searchParams.set('w', params.width.toString());
    }
    if (params?.height) {
        url.searchParams.set('h', params.height.toString());
    }
    if (params?.quality) {
        url.searchParams.set('q', params.quality.toString());
    }
    return url.toString();
}
export function validateImageFile(file, options) {
    const maxSize = options?.maxSize || 10 * 1024 * 1024;
    const allowedTypes = options?.allowedTypes || [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipo de arquivo não suportado. Aceitos: ${allowedTypes.join(', ')}`
        };
    }
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return {
            valid: false,
            error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
        };
    }
    return { valid: true };
}
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export function getImageInfo(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight
            });
        };
        img.onerror = () => {
            reject(new Error('Não foi possível carregar a imagem'));
        };
        img.src = URL.createObjectURL(file);
    });
}
