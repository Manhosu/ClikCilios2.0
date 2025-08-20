import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move,
  Info,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { imagensService, type ImagemCliente } from '../../services/imagensService';
import { toast } from 'react-hot-toast';

interface ImageViewerProps {
  image: ImagemCliente | null;
  images?: ImagemCliente[];
  onClose: () => void;
  onDelete?: (imageId: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  showNavigation?: boolean;
  showInfo?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  images = [],
  onClose,
  onDelete,
  onNext,
  onPrev,
  showNavigation = false,
  showInfo = true
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageInfo, setShowImageInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [descricaoEditavel, setDescricaoEditavel] = useState('');
  const [editandoDescricao, setEditandoDescricao] = useState(false);

  // Função para extrair o estilo de cílio da descrição
  const extrairEstiloCilio = (descricao: string | null | undefined) => {
    if (!descricao) return 'Não especificado'
    
    // Procura por padrões como "estilo Volume Russo", "com estilo Clássico", etc.
    const match = descricao.match(/(?:estilo|com estilo)\s+([^-]+)/i)
    if (match) {
      return match[1].trim()
    }
    
    // Se não encontrar o padrão, retorna a descrição completa
    return descricao
  }

  // Função para salvar a descrição editada
  const salvarDescricao = async () => {
    if (!image) return
    
    try {
      await imagensService.atualizar(image.id, {
        descricao: descricaoEditavel
      })
      
      setEditandoDescricao(false)
      toast.success('Descrição atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error)
      toast.error('Erro ao atualizar descrição')
    }
  }

  // Reset transformations when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
  }, [image?.id]);

  // Initialize editable description when image changes
  useEffect(() => {
    if (image) {
      setDescricaoEditavel(image.descricao || '');
      setEditandoDescricao(false);
    }
  }, [image?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          setShowImageInfo(prev => !prev);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Delete':
          e.preventDefault();
          if (onDelete) {
            handleDelete();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose, onNext, onPrev, onDelete]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // Rotation
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // Mouse drag handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  // Delete image
  const handleDelete = useCallback(async () => {
    if (!image || !onDelete) return;

    const confirmed = window.confirm('Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await onDelete(image.id);
      toast.success('Imagem deletada com sucesso');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar imagem';
      toast.error(errorMessage);
    }
  }, [image, onDelete, onClose]);

  // Download image
  const handleDownload = useCallback(async () => {
    if (!image) return;

    try {
      // Usar URL direta do Supabase para download
      const imageUrl = image.url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.original_name || image.nome || 'imagem';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download iniciado');
    } catch (err) {
      toast.error('Erro ao fazer download da imagem');
    }
  }, [image]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Get current image index
  const currentIndex = image && images.length > 0 
    ? images.findIndex(img => img.id === image.id)
    : -1;

  if (!image) return null;

  return (
    <div className={`
      fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center
      ${isFullscreen ? 'bg-black' : ''}
    `}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium truncate max-w-md" title={image.original_name}>
              {image.original_name}
            </h3>
            {showNavigation && images.length > 1 && (
              <span className="text-sm text-gray-300">
                {currentIndex + 1} de {images.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Diminuir zoom (-)" 
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <span className="text-sm min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Aumentar zoom (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Resetar zoom (0)"
            >
              <Move className="h-5 w-5" />
            </button>
            
            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Girar (R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            
            {/* Info toggle */}
            {showInfo && (
              <button
                onClick={() => setShowImageInfo(prev => !prev)}
                className={`p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors ${
                  showImageInfo ? 'bg-white bg-opacity-20' : ''
                }`}
                title="Informações (I)"
              >
                <Info className="h-5 w-5" />
              </button>
            )}
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Tela cheia (F)"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
            
            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Delete */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors"
                title="Deletar (Delete)"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Fechar (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {showNavigation && images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            disabled={currentIndex <= 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Imagem anterior (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={onNext}
            disabled={currentIndex >= images.length - 1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Próxima imagem (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Image container */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        {hasError ? (
          <div className="text-white text-center">
            <p className="text-lg mb-2">Erro ao carregar imagem</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.original_name}
            className="max-w-none transition-transform duration-200 select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: zoom === 1 ? '90vh' : 'none',
              maxWidth: zoom === 1 ? '90vw' : 'none'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Image info panel */}
      {showInfo && showImageInfo && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black to-transparent p-4">
          <div className="bg-black bg-opacity-50 rounded-lg p-4 text-white max-w-lg">
            <h4 className="font-medium mb-4 flex items-center">
              <span className="mr-2">🖼️</span>
              Informações da Imagem
            </h4>
            <div className="space-y-4 text-sm">
              {/* Cílio Utilizado */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-300 mr-2">💄</span>
                  <span className="text-gray-300 font-medium">Cílio Utilizado:</span>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2">
                  <span className="text-yellow-200 font-medium">
                    {extrairEstiloCilio(image.descricao)}
                  </span>
                </div>
              </div>

              {/* Descrição Editável */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-blue-300 mr-2">📝</span>
                    <span className="text-gray-300 font-medium">Descrição:</span>
                  </div>
                  {!editandoDescricao && (
                    <button
                      onClick={() => setEditandoDescricao(true)}
                      className="text-blue-300 hover:text-blue-200 text-xs font-medium px-2 py-1 bg-white bg-opacity-10 rounded"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                {editandoDescricao ? (
                  <div className="space-y-2">
                    <textarea
                      value={descricaoEditavel}
                      onChange={(e) => setDescricaoEditavel(e.target.value)}
                      className="w-full p-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 resize-none text-sm"
                      rows={3}
                      placeholder="Digite uma descrição para a imagem..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={salvarDescricao}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        ✅ Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditandoDescricao(false)
                          setDescricaoEditavel(image.descricao || '')
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-10 rounded-lg p-2">
                    <span className="text-gray-200">
                      {image.descricao || 'Nenhuma descrição adicionada'}
                    </span>
                  </div>
                )}
              </div>

              {/* Data de Geração */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-green-300 mr-2">📅</span>
                  <span className="text-gray-300 font-medium">Data de Geração:</span>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2">
                  <span className="text-green-200 font-medium">
                    {image.created_at ? new Date(image.created_at).toLocaleString('pt-BR') : 'Não disponível'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 right-4 text-white text-xs opacity-50">
        <div className="bg-black bg-opacity-50 rounded px-2 py-1">
          ESC: Fechar • ←→: Navegar • +/-: Zoom • R: Girar • I: Info • F: Tela cheia
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;