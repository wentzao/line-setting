// utils/image.js - Image processing utilities

/**
 * Read File as Data URL
 * @param {File} file - File object to read
 * @returns {Promise<string>} Data URL string
 */
export function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Resize image data URL to target dimensions
 * @param {string} dataUrl - Source image data URL
 * @param {number} targetW - Target width
 * @param {number} targetH - Target height
 * @param {string} mime - Output MIME type
 * @param {number} quality - Output quality (0-1)
 * @returns {Promise<string>} Resized image data URL
 */
export async function resizeImageDataUrl(dataUrl, targetW, targetH, mime = 'image/jpeg', quality = 0.9) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetW, targetH);
                const out = canvas.toDataURL(mime, quality);
                resolve(out);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

/**
 * Convert data URL to Blob
 * @param {string} dataUrl - Data URL to convert
 * @returns {Blob} Blob object
 */
export function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

/**
 * Get image dimensions from data URL
 * @param {string} dataUrl - Image data URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
    });
}

/**
 * Draw image on canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {string} dataUrl - Image data URL
 * @param {number} w - Width to draw
 * @param {number} h - Height to draw
 * @returns {Promise<void>}
 */
export function drawImageOnCanvas(ctx, dataUrl, w, h) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h);
            resolve();
        };
        img.src = dataUrl;
    });
}
