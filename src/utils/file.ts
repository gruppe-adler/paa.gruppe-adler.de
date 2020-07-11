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
