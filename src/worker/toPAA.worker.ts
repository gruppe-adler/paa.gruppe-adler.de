import init from '@/utils/aff';
import { PAA_MIME_TYPE } from '@/utils/mime';

/**
 * Generate a paa from an ImageData object
 * @param {ImageData} data image data
 * @returns {Promise<Blob>} the paa as a blob
 */
async function convertImageToPaa (data: ImageData): Promise<Blob> {
    const aff = await init();

    const uint8array = aff.encode(data);

    return new Blob([uint8array.buffer], { type: PAA_MIME_TYPE });
}

addEventListener('message', async (event: MessageEvent) => {
    const imageDate = event.data as ImageData;

    let msg: { type: 'data'|'error', data: unknown };
    try {
        const blob = await convertImageToPaa(imageDate);
        msg = { type: 'data', data: blob };
    } catch (err) {
        msg = { type: 'error', data: err };
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    postMessage(msg, this!);
});
