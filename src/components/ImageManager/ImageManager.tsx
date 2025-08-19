import React, { useState, useCallback } from 'react';
import { Upload, Grid, Info } from 'lucide-react';
import ImageUpload from '../ImageUpload/ImageUpload';
import ImageGallery from '../ImageGallery/ImageGallery';
import ImageViewer from '../ImageViewer/ImageViewer';
import { useAuthContext } from '../../hooks/useAuthContext';
import { type ImagemCliente } from '../../services/imagensService';
import { toast } from 'react-hot-toast';

interface ImageManagerProps {
  className?: string;
  defaultTab?: 'upload' | 'gallery';
  onImageSelect?: (image: ImagemCliente) => void;
  selectable?: boolean;
}

type Tab = 'upload' | 'gallery';

const ImageManager: React.FC<ImageManagerProps> = ({
  className = '',
  defaultTab = 'upload',
  onImageSelect,
  selectable = false
}) => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [selectedImage, setSelectedImage] = useState<ImagemCliente | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImagemCliente[]>([]);
  const [refreshGallery, setRefreshGallery] = useState(0);

  // Handle successful upload
  const handleUploadSuccess = useCallback((image: ImagemCliente) => {
    // Add new image to gallery
    setGalleryImages(prev => [image, ...prev]);
    
    // Switch to gallery tab to show uploaded image
    setActiveTab('gallery');
    
    // Trigger gallery refresh
    setRefreshGallery(prev => prev + 1);
    
    toast.success('Imagem enviada com sucesso!');
  }, []);

  // Handle image selection from gallery
  const handleImageSelect = useCallback((image: ImagemCliente) => {
    if (onImageSelect) {
      onImageSelect(image);
    } else {
      setSelectedImage(image);
    }
  }, [onImageSelect]);

  // Handle image deletion
  const handleImageDelete = useCallback((imageId: string) => {
    // Remove from gallery images
    setGalleryImages(prev => prev.filter(img => img.id !== imageId));
    
    // Close viewer if deleted image is currently viewed
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
    
    // Trigger gallery refresh
    setRefreshGallery(prev => prev + 1);
  }, [selectedImage]);

  // Handle viewer navigation
  const handleViewerNext = useCallback(() => {
    if (!selectedImage || galleryImages.length === 0) return;
    
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  }, [selectedImage, galleryImages]);

  const handleViewerPrev = useCallback(() => {
    if (!selectedImage || galleryImages.length === 0) return;
    
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    setSelectedImage(galleryImages[prevIndex]);
  }, [selectedImage, galleryImages]);

  if (!user) {
    return (
      <div className={`bg-white rounded-lg border p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gerenciador de Imagens
          </h3>
          <p className="text-gray-600 mb-6">
            Faça login para enviar e gerenciar suas imagens de forma segura.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Recursos disponíveis:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Upload de múltiplas imagens</li>
                  <li>• Galeria organizada por usuário</li>
                  <li>• Visualização em tela cheia</li>
                  <li>• Gerenciamento seguro de arquivos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header with tabs */}
      <div className="border-b bg-gray-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Gerenciador de Imagens
            </h2>
            
            {/* Tabs */}
            <div className="flex bg-white rounded-lg border">
              <button
                onClick={() => setActiveTab('upload')}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-colors
                  ${activeTab === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
              
              <button
                onClick={() => setActiveTab('gallery')}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r-lg transition-colors border-l
                  ${activeTab === 'gallery' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Grid className="h-4 w-4" />
                Galeria
              </button>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span>Logado como {user.email}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'upload' ? (
          <ImageUpload
            onUploadSuccess={handleUploadSuccess}
            className=""
          />
        ) : (
          <ImageGallery
            onImageSelect={handleImageSelect}
            onImageDelete={handleImageDelete}
            selectable={selectable}
            key={refreshGallery} // Force refresh when needed
            className=""
          />
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          image={selectedImage}
          images={galleryImages}
          onClose={() => setSelectedImage(null)}
          onDelete={handleImageDelete}
          onNext={handleViewerNext}
          onPrev={handleViewerPrev}
          showNavigation={galleryImages.length > 1}
          showInfo={true}
        />
      )}
    </div>
  );
};

export default ImageManager;