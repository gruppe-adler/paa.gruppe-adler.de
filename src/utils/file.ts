/**
 * Why do we not just use File?
 * Well... because old Edge is shitty af and can't handle the File constructor (see https://stackoverflow.com/a/43241922)
 */
export interface CustomFile {
    blob: Blob;
    name: string;
}

/**
 * Checks whether given file is supported
 * @param {File} file file
 * @returns {boolean} File is supported?
 */
export function isSupportedFile (file: File): boolean {
    return (file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/jpeg' || /\.paa$/i.test(file.name));
}

/**
 * Checks whether given file is supported
 * @param {File} file file
 * @returns {string|undefined} file extension
 */
export function getFileExtension (file: File): string|undefined {
    const ext = file.name.split('.').pop();

    if (ext === undefined) return ext;

    return ext.toLowerCase();
}

/**
 * Get file's name without extension
 * @param {File} file file
 * @returns {string} file name without extension
 */
export function getFileNameWithoutExtension (file: File): string {
    return file.name.split('.').slice(0, -1).join('.');
}

/**
 * Get blob from data-uri
 * @param {string} dataURI data uri
 * @returns {Blob} blob
 */
export function dataURItoBlob (dataURI: string): Blob {
    // convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
}

/**
 * Download given file
 * @param {File} file File to download
 */
export function download (file: CustomFile) {
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
