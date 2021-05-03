/**
 * Return Blob from ImageData.
 * For further details on type and quality param see the [HTMLCanvasElement.toBlob() documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Parameters)
 * @param {ImageData} data Image data
 * @param {string} [type] Image format (default: 'image/png')
 * @param {number} [quality] Number between 0 and 1 indicating the image quality for image formats with lossy compression
 * @returns {Blob}
 */
export function imageDataToBlob (data: ImageData, type = 'image/png', quality = 1): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('Couldn\'t get context of canvas.');

    ctx.putImageData(data, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            canvas.remove();
            if (blob === null) {
                reject(new Error('Couldn\'t generate blob from canvas.'));
            } else {
                resolve(blob);
            }
        }, type, quality);
    });
}

/**
 * Load image from url
 * @param {string} url Image URL
 * @returns {Promise<HTMLImageElement>} Promise, which resolves into HTMLImageElement
 */
async function loadImage (url: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(Error('Image loading error'));
    });

    if (img.decode) {
        // Nice off-thread way supported in Safari/Chrome.
        // Safari throws on decode if the source is SVG.
        // https://bugs.webkit.org/show_bug.cgi?id=188347
        await img.decode().catch(() => null);
    }

    // Always await loaded, as we may have bailed due to the Safari bug above.
    await loaded;
    return img;
}

/**
 * Load image from blob
 * @param {string} blob Image
 * @returns {Promise<HTMLImageElement>} Promise, which resolves into HTMLImageElement
 */
async function blobToImg(blob: Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(blob);
    try {
        return await loadImage(url);
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function drawableFromBlob (blob: Blob): Promise<HTMLImageElement|ImageBitmap> {
    // Special-case SVG. We need to avoid createImageBitmap because of
    // https://bugs.chromium.org/p/chromium/issues/detail?id=606319.
    // Also, we cache the HTMLImageElement so we can perform vector resizing later.
    if (blob.type.startsWith('image/svg+xml')) {
        // Firefox throws if you try to draw an SVG to canvas that doesn't have width/height.
        // In Chrome it loads, but drawImage behaves weirdly.
        // This function sets width/height if it isn't already set.
        const parser = new DOMParser();
        const text = await new Response(blob).text();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.documentElement;

        if (doc.getElementsByTagName('parsererror').length > 0) throw Error('This is not a valid SVG');

        if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
            return blobToImg(blob);
        }

        const viewBox = svg.getAttribute('viewBox');
        if (viewBox === null) throw Error('SVG must have width/height or viewBox');

        const [, , w, h] = viewBox.split(/\s+/);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);

        const serializer = new XMLSerializer();
        const newSource = serializer.serializeToString(doc);

        return blobToImg(new Blob([newSource], { type: 'image/svg+xml' }));
    }

    // Prefer createImageBitmap as it's the off-thread option for Firefox.
    const drawable =
        'createImageBitmap' in self
            ? await createImageBitmap(blob)
            : await blobToImg(blob);

    return drawable;
}

/**
 * Get ImageData Object from file
 * @param {Blob} blob Blob to get data from
 * @returns {Promise<ImageData>} Promise, which resolves into ImageData object
 */
export async function imageDataFromBlob (blob: Blob): Promise<ImageData> {
    const drawable = await drawableFromBlob(blob);

    const canvas = document.createElement('canvas');
    canvas.width = drawable.width;
    canvas.height = drawable.height;

    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('Couldn\'t get context of canvas.');

    ctx.drawImage(drawable, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.remove();

    return data;
}
