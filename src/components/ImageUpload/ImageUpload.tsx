import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { uploadImageToSupabase, type UploadedImage } from '../../services/imageService';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  onUploadSuccess?: (image: UploadedImage) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // em bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  multiple = false,
  className = ''
}) => {
  const { user } = useAuthContext();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validação de arquivo
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Aceitos: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / 1024 / 1024);
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  // Função de upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const fileArray = Array.from(files);
    setIsUploading(true);

    try {
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          onUploadError?.(validationError);
          continue;
        }

        // Inicializar progresso
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        try {
          // Simular progresso (já que a API não suporta progress real)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: Math.min(prev[file.name] + 10, 90)
            }));
          }, 100);

          const imageUrl = await uploadImageToSupabase(file, user?.id || '');
          
          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          // Criar objeto UploadedImage
          const uploadedImage: UploadedImage = {
            id: crypto.randomUUID(),
            original_name: file.name,
            url: imageUrl,
            file_size: file.size,
            mime_type: file.type,
            path: imageUrl
          };

          // Adicionar à lista de arquivos enviados
          setUploadedFiles(prev => [...prev, uploadedImage]);
          
          toast.success(`${file.name} enviado com sucesso!`);
          onUploadSuccess?.(uploadedImage);

          // Remover progresso após 2 segundos
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 2000);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
          toast.error(`Erro ao enviar ${file.name}: ${errorMessage}`);
          onUploadError?.(errorMessage);
          
          // Remover progresso em caso de erro
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [user, validateFile, onUploadSuccess, onUploadError]);

  // Handlers de drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // Handler para input de arquivo
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  }, [handleUpload]);

  // Abrir seletor de arquivos
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Faça login para enviar imagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de upload */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? 'Enviando...' : 'Clique ou arraste imagens aqui'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Máximo {Math.round(maxFileSize / 1024 / 1024)}MB por arquivo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formatos aceitos: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Progresso de upload */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Enviando arquivos:</h4>
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 truncate">{filename}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de arquivos enviados recentemente */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Enviados recentemente:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)} • {file.mime_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;