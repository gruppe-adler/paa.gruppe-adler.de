/**
 * Why do we not just use File?
 * Well... because old Edge is shitty af and can't handle the File constructor (see https://stackoverflow.com/a/43241922)
 */
export interface GradPaaFile {
    blob: Blob;
    name: string;
}

export const PAA_MIME_TYPE = 'image/vnd.paa';

/**
 * Checks whether given file is supported
 * @param {File} file File
 * @returns {boolean} File is supported?
 */
export function isSupportedFile ({ blob, name }: GradPaaFile): boolean {
    return (['image/png', 'image/svg+xml', 'image/jpeg', PAA_MIME_TYPE].includes(blob.type) || /\.paa$/i.test(name));
}

/**
 * Checks whether given file is supported
 * @param {File} file File
 * @returns {string|undefined} file extension
 */
export function getFileExtension (name: string): string|undefined {
    const ext: undefined|string = name.split('.').pop();

    return ext?.toLowerCase();
}

/**
 * Get file's name without extension
 * @param {File} file File
 * @returns {string} file name without extension
 */
export function getFileNameWithoutExtension (name: string): string {
    return name.split('.').slice(0, -1).join('.');
}

/**
 * Download given file
 * @param {File} file File to download
 */
export function download (file: GradPaaFile): void {
    const url = URL.createObjectURL(file.blob);

    const link = document.createElement('a');
    link.download = file.name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    link.remove();

    // we revoke the url only after a delay because old Edge can't handle it otherwise
    window.setTimeout(() => URL.revokeObjectURL(url), 200);
}

/**
 * Reads file as a array buffer
 * @param {File} file File to read
 * @returns {Promise<ArrayBuffer>}
 */
export function readFile (file: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
