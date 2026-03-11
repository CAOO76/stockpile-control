/**
 * Utility for client-side image compression and resizing using HTML5 Canvas.
 * Used to reduce memory footprint and optimization storage quota.
 */

/**
 * Compresses and resizes an image.
 * 
 * @param fileOrBase64 - The input image as a File object or base64 DataURL.
 * @param maxWidth - Maximum width for the output image. Defaults to 1024px.
 * @param quality - JPEG compression quality (0 to 1). Defaults to 0.7.
 * @returns A promise that resolves to the compressed image as a base64 DataURL.
 */
export const compressImage = async (
    fileOrBase64: File | string,
    maxWidth = 1024,
    quality = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let objectUrl: string | null = null;

        img.onload = () => {
            // Memory cleanup: revoke object URL if created
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }

            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Logic: Maintain aspect ratio and strictly avoid upscaling
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // High quality resizing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);

            // Export as JPEG with specified quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            // Explicitly clear references for GC
            canvas.width = 0;
            canvas.height = 0;
            
            resolve(compressedBase64);
        };

        img.onerror = () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for compression'));
        };

        // Handle input type
        if (fileOrBase64 instanceof File) {
            objectUrl = URL.createObjectURL(fileOrBase64);
            img.src = objectUrl;
        } else {
            img.src = fileOrBase64;
        }
    });
};
