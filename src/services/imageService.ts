import { supabase } from '../lib/supabase';

export interface UploadedImage {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

export interface ImageListResponse {
  images: UploadedImage[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  directory_stats: {
    total_images: number;
    total_size: number;
    total_size_mb: number;
    directory_path: string;
    created_at: string;
    updated_at: string;
  } | null;
  sort: {
    field: string;
    order: string;
  };
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
  data: {
    total_requested: number;
    successful_deletions: number;
    failed_deletions: number;
    deleted_images: string[];
    failed_images: string[];
    errors: { [key: string]: string };
  };
}

/**
 * Obtém o token de autenticação atual
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return null;
  }
}

/**
 * Faz upload de uma imagem
 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Falha no upload');
    }

    return result.data;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido no upload');
  }
}

/**
 * Lista imagens do usuário
 */
export async function listImages({
  page = 1,
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'desc'
}: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<ImageListResponse> {
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
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao listar imagens');
  }
}

/**
 * Deleta uma ou múltiplas imagens
 */
export async function deleteImages(imageIds: string | string[]): Promise<DeleteImageResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
    
    const params = new URLSearchParams();
    if (ids.length === 1) {
      params.append('imageId', ids[0]);
    } else {
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
  } catch (error) {
    console.error('Erro ao deletar imagens:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao deletar imagens');
  }
}

/**
 * Obtém URL para visualizar uma imagem
 */
export function getImageUrl(imageId: string): string {
  return `/api/serve-image?imageId=${encodeURIComponent(imageId)}`;
}

/**
 * Obtém URL para visualizar uma imagem com parâmetros de redimensionamento
 */
export function getImageUrlWithParams(imageId: string, params?: {
  width?: number;
  height?: number;
  quality?: number;
}): string {
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

/**
 * Valida se um arquivo é uma imagem válida
 */
export function validateImageFile(file: File, options?: {
  maxSize?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 10 * 1024 * 1024; // 10MB
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

/**
 * Formata tamanho de arquivo em formato legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtém informações de uma imagem (dimensões, etc.)
 */
export function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
}> {
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