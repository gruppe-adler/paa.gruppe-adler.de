/**
 * Return data url from imageData.
 * For further details on type and quality param see the [HTMLCanvasElement.toDataURL() documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL#Parameters)
 * @param {ImageData} data image data
 * @param {string} [type] image format (default: 'image/png')
 * @param {number} [quality] Number between 0 and 1 indicating the image quality for image formats with lossy compression
 * @returns {string} url
 */
export function imageDataToUrl (data: ImageData, type = 'image/png', quality = 1): string {
    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('Couldn`t get context of canvas.');

    ctx.putImageData(data, 0, 0);
    const url = canvas.toDataURL(type, quality);

    canvas.remove();

    return url;
}

/**
 * Load image from url
 * @param {string} url image url
 * @returns {Promise<HTMLImageElement>} Promise, which resolves into HTMLImageElement
 */
function loadImage (url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;

        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
};

/**
 * Get ImageData Object from file
 * @param {File} file file to get data from
 * @returns {Promise<ImageData>} Promise, which resolves into ImageData object
 */
export async function imageDataFromFile (file: File): Promise<ImageData> {
    const fileUrl = URL.createObjectURL(file);

    const img = await loadImage(fileUrl);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('Couldn`t get context of canvas.');

    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.remove();
    img.remove();

    return data;
}
