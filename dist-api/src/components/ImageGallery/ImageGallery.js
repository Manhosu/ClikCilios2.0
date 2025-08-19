import React, { useState, useEffect, useCallback } from 'react';
import { Grid, List, Trash2, Eye, Search, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { listImages, deleteImages, getImageUrl, formatFileSize } from '../../services/imageService';
import { toast } from 'react-hot-toast';
const ImageGallery = ({ onImageSelect, onImageDelete, selectable = false, className = '' }) => {
    const { user } = useAuthContext();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [directoryStats, setDirectoryStats] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const loadImages = useCallback(async (page = 1) => {
        if (!user)
            return;
        try {
            setLoading(true);
            setError(null);
            const response = await listImages({
                page,
                limit: 20,
                sortBy: sortField,
                sortOrder
            });
            setImages(response.images);
            setPagination(response.pagination);
            setDirectoryStats(response.directory_stats);
            setCurrentPage(page);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imagens';
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setLoading(false);
        }
    }, [user, sortField, sortOrder]);
    useEffect(() => {
        loadImages(1);
    }, [loadImages]);
    const filteredImages = images.filter(image => image.original_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const toggleImageSelection = useCallback((imageId) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            }
            else {
                newSet.add(imageId);
            }
            return newSet;
        });
    }, []);
    const clearSelection = useCallback(() => {
        setSelectedImages(new Set());
    }, []);
    const handleDeleteSelected = useCallback(async () => {
        if (selectedImages.size === 0)
            return;
        const confirmed = window.confirm(`Tem certeza que deseja deletar ${selectedImages.size} imagem(ns)? Esta ação não pode ser desfeita.`);
        if (!confirmed)
            return;
        try {
            setIsDeleting(true);
            const imageIds = Array.from(selectedImages);
            const result = await deleteImages(imageIds);
            if (result.success) {
                toast.success(result.message);
                setImages(prev => prev.filter(img => !result.data.deleted_images.includes(img.id)));
                clearSelection();
                result.data.deleted_images.forEach(imageId => {
                    onImageDelete?.(imageId);
                });
                await loadImages(currentPage);
            }
            else {
                toast.error(result.message);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar imagens';
            toast.error(errorMessage);
        }
        finally {
            setIsDeleting(false);
        }
    }, [selectedImages, onImageDelete, loadImages, currentPage, clearSelection]);
    const handleDeleteSingle = useCallback(async (imageId) => {
        const confirmed = window.confirm('Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.');
        if (!confirmed)
            return;
        try {
            setIsDeleting(true);
            const result = await deleteImages(imageId);
            if (result.success) {
                toast.success('Imagem deletada com sucesso');
                setImages(prev => prev.filter(img => img.id !== imageId));
                onImageDelete?.(imageId);
                await loadImages(currentPage);
            }
            else {
                toast.error(result.message);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar imagem';
            toast.error(errorMessage);
        }
        finally {
            setIsDeleting(false);
        }
    }, [onImageDelete, loadImages, currentPage]);
    const handlePageChange = useCallback((page) => {
        loadImages(page);
    }, [loadImages]);
    const handleSortChange = useCallback((field, order) => {
        setSortField(field);
        setSortOrder(order);
    }, []);
    if (!user) {
        return (<div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-gray-600">Faça login para ver suas imagens</p>
        </div>
      </div>);
    }
    return (<div className={`space-y-6 ${className}`}>
      
      {directoryStats && (<div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suas Imagens</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{directoryStats.total_images}</p>
              <p className="text-sm text-gray-600">Total de Imagens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{directoryStats.total_size_mb} MB</p>
              <p className="text-sm text-gray-600">Espaço Utilizado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatFileSize(directoryStats.total_size / directoryStats.total_images || 0)}</p>
              <p className="text-sm text-gray-600">Tamanho Médio</p>
            </div>
          </div>
        </div>)}

      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input type="text" placeholder="Buscar imagens..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          
          <div className="flex items-center gap-2">
            
            {selectable && selectedImages.size > 0 && (<div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">
                  {selectedImages.size} selecionada(s)
                </span>
                <button onClick={handleDeleteSelected} disabled={isDeleting} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
                  {isDeleting ? 'Deletando...' : 'Deletar'}
                </button>
                <button onClick={clearSelection} className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                  Limpar
                </button>
              </div>)}

            
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Grid className="h-4 w-4"/>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <List className="h-4 w-4"/>
            </button>

            
            <button onClick={() => loadImages(currentPage)} disabled={loading} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
            </button>
          </div>
        </div>

        
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <select value={`${sortField}-${sortOrder}`} onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            handleSortChange(field, order);
        }} className="text-sm border border-gray-300 rounded px-3 py-1">
            <option value="created_at-desc">Mais recentes</option>
            <option value="created_at-asc">Mais antigas</option>
            <option value="original_name-asc">Nome (A-Z)</option>
            <option value="original_name-desc">Nome (Z-A)</option>
            <option value="file_size-desc">Maior tamanho</option>
            <option value="file_size-asc">Menor tamanho</option>
          </select>
        </div>
      </div>

      
      {loading ? (<div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>) : error ? (<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2"/>
          <p className="text-red-800">{error}</p>
          <button onClick={() => loadImages(currentPage)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Tentar novamente
          </button>
        </div>) : filteredImages.length === 0 ? (<div className="text-center p-12 bg-gray-50 rounded-lg border">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-gray-600">
            {searchTerm ? 'Nenhuma imagem encontrada para sua busca' : 'Nenhuma imagem encontrada'}
          </p>
        </div>) : (<>
          
          {viewMode === 'grid' ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image) => (<div key={image.id} className={`
                    relative group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-200
                    ${selectable && selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''}
                  `}>
                  
                  {selectable && (<div className="absolute top-2 left-2 z-10">
                      <input type="checkbox" checked={selectedImages.has(image.id)} onChange={() => toggleImageSelection(image.id)} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"/>
                    </div>)}

                  
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img src={getImageUrl(image.id)} alt={image.original_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onClick={() => onImageSelect?.(image)}/>
                  </div>

                  
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate" title={image.original_name}>
                      {image.original_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(image.file_size)}
                    </p>
                  </div>

                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <button onClick={() => onImageSelect?.(image)} className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70" title="Visualizar">
                        <Eye className="h-3 w-3"/>
                      </button>
                      <button onClick={() => handleDeleteSingle(image.id)} disabled={isDeleting} className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 disabled:opacity-50" title="Deletar">
                        <Trash2 className="h-3 w-3"/>
                      </button>
                    </div>
                  </div>
                </div>))}
            </div>) : (<div className="bg-white rounded-lg border overflow-hidden">
              <div className="divide-y">
                {filteredImages.map((image) => (<div key={image.id} className={`
                      flex items-center gap-4 p-4 hover:bg-gray-50
                      ${selectable && selectedImages.has(image.id) ? 'bg-blue-50' : ''}
                    `}>
                    
                    {selectable && (<input type="checkbox" checked={selectedImages.has(image.id)} onChange={() => toggleImageSelection(image.id)} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"/>)}

                    
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={getImageUrl(image.id)} alt={image.original_name} className="w-full h-full object-cover"/>
                    </div>

                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.original_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(image.file_size)} • {image.mime_type}
                      </p>
                      {image.created_at && (<p className="text-xs text-gray-400 mt-1">
                          {new Date(image.created_at).toLocaleDateString('pt-BR')}
                        </p>)}
                    </div>

                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => onImageSelect?.(image)} className="p-2 text-gray-400 hover:text-gray-600" title="Visualizar">
                        <Eye className="h-4 w-4"/>
                      </button>
                      <button onClick={() => handleDeleteSingle(image.id)} disabled={isDeleting} className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50" title="Deletar">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </div>))}
              </div>
            </div>)}

          
          {pagination && pagination.total_pages > 1 && (<div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.current_page - 1) * pagination.items_per_page) + 1} a{' '}
                {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} de{' '}
                {pagination.total_items} imagens
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={!pagination.has_prev_page || loading} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4"/>
                </button>
                
                <span className="px-4 py-2 text-sm">
                  Página {pagination.current_page} de {pagination.total_pages}
                </span>
                
                <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={!pagination.has_next_page || loading} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4"/>
                </button>
              </div>
            </div>)}
        </>)}
    </div>);
};
export default ImageGallery;
