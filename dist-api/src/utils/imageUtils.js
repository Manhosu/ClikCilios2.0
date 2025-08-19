export const validateImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
        return false;
    }
    if (file.size > maxSize) {
        return false;
    }
    return true;
};
export const formatImageName = (filename) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = filename.split('.').pop();
    return `cilios_${timestamp}.${extension}`;
};
export const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const { width, height } = img;
            let newWidth = width;
            let newHeight = height;
            if (width > maxWidth) {
                newWidth = maxWidth;
                newHeight = (height * maxWidth) / width;
            }
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = (width * maxHeight) / height;
            }
            canvas.width = newWidth;
            canvas.height = newHeight;
            if (ctx) {
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            }
            else {
                reject(new Error('Erro ao redimensionar imagem'));
            }
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = URL.createObjectURL(file);
    });
};
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};
