import { loadImage } from './image';

export const PAA_MIME_TYPE = 'image/vnd.paa';

/**
 * MIME Types supported by this converter
 */
const SUPPORTED_MIME_TYPES = (async () => {
    const types: Array<[string, string]> = [
        [PAA_MIME_TYPE, 'PAA'],
        ['image/png', 'PNG'],
        ['image/jpeg', 'JPEG'],
        ['image/svg+xml', 'SVG'],
        ['image/bmp', 'BMP'],
        ['image/gif', 'GIF'],
        ['image/x-icon', 'ICO']
    ];

    const checkedTypes = await Promise.all([
        checkSupport(['image/webp', 'WebP'], 'data:image/webp;base64,UklGRhYAAABXRUJQVlA4TAoAAAAvAAAAAEX/I/of'),
        checkSupport(['image/avif', 'AVIF'], 'data:image/avif;base64,AAAAFGZ0eXBhdmlmAAAAAG1pZjEAAACgbWV0YQAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAC8AAAAGwAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAARWlwcnAAAAAoaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAADGF2MUOBAAAAAAAAFWlwbWEAAAAAAAAAAQABAgECAAAAI21kYXQSAAoIP8R8hAQ0BUAyDWeeUy0JG+QAACANEkA='),
        checkSupport(['image/jxl', 'JPEG XL'], 'data:image/jxl;base64,/woAELASCAgQADAASxLFgoUUlw17/v8f')
    ]);

    for (const type of checkedTypes) {
        if (type !== undefined) types.push(type);
    }
    return new Map(types);
})();

/**
 * Extensions supported by this converter. This includes just all extensions, which
 * are not already covered by `SUPPORTED_MIME_TYPES`.
 */
const ADDITIONAL_SUPPORTED_EXTENSIONS = ['paa'];

const EXTENSIONS_REGEXP = new RegExp(`\\.(${ADDITIONAL_SUPPORTED_EXTENSIONS.join('|')})$`, 'i');

/**
 * Check if file is supported.
 * @param type MIME Type
 * @param name File Name
 * @returns is supported
 */
export async function isSupported(type: string, name: string): Promise<boolean> {
    return (await SUPPORTED_MIME_TYPES).has(type) || EXTENSIONS_REGEXP.test(name);
}

/**
 * Generate "accept" attribute value that fits our supported file formats
 * @param type MIME Type
 * @param name File Name
 * @returns is supported
 */
export async function acceptField(): Promise<string> {
    const mimeTypes = (await SUPPORTED_MIME_TYPES).keys();

    return [...mimeTypes, ...ADDITIONAL_SUPPORTED_EXTENSIONS.map(e => `.${e}`)].join(',');
}

/**
 * Generate list of display names of supported formats
 * @returns Names of supported formats
 */
export async function supportedNames(): Promise<string[]> {
    return Array.from((await SUPPORTED_MIME_TYPES).values());
}

async function checkSupport (entry: [string, string], url: string): Promise<[string, string]|undefined> {
    try {
        await loadImage(url);
    } catch (err) {
        return undefined;
    }

    return entry;
}
