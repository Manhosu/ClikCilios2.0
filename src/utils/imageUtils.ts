/**
 * Valida se o arquivo é uma imagem válida
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!validTypes.includes(file.type)) {
    return false
  }
  
  if (file.size > maxSize) {
    return false
  }
  
  return true
}

/**
 * Formata o nome do arquivo para um nome mais amigável
 */
export const formatImageName = (filename: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const extension = filename.split('.').pop()
  return `cilios_${timestamp}.${extension}`
}

/**
 * Redimensiona uma imagem mantendo a proporção
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      
      // Calcula as novas dimensões mantendo a proporção
      let newWidth = width
      let newHeight = height
      
      if (width > maxWidth) {
        newWidth = maxWidth
        newHeight = (height * maxWidth) / width
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight
        newWidth = (width * maxHeight) / height
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      } else {
        reject(new Error('Erro ao redimensionar imagem'))
      }
    }
    
    img.onerror = () => reject(new Error('Erro ao carregar imagem'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Converte File para base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
} 