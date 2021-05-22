import init from '@/utils/aff';
import { readFile } from '@/utils/file';

/**
 * Generate a image from an paa file object
 * @param {File} file Paa file
 * @returns {Promise<ImageData>} Image Data
 */
export async function convertPaaToImage (blob: Blob): Promise<ImageData> {
    const arrayBuffer = await readFile(blob);
    const uint8array = new Uint8Array(arrayBuffer);

    const aff = await init();

    return aff.decode(uint8array);
}

addEventListener('message', async (event: MessageEvent) => {
    const blob = event.data as Blob;

    let msg: { type: 'data'|'error', data: unknown };
    try {
        const imageData = await convertPaaToImage(blob);
        msg = { type: 'data', data: imageData };
    } catch (err) {
        msg = { type: 'error', data: err };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    postMessage(msg, this!);
});
