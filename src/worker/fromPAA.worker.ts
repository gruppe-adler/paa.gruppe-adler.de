import setupAFF from '@/utils/aff';
import { readFile } from '@/utils/file';

/**
 * Generate a image from an paa file object
 * @param {File} file Paa file
 * @returns {Promise<ImageData>} Image Data
 */
export async function convertPaaToImage (file: File): Promise<ImageData> {
    const AFF = await setupAFF();
    const arrayBuffer = await readFile(file);
    const uint8array = new Uint8Array(arrayBuffer);

    // eslint-disable-next-line new-cap
    const pixelVector = new AFF.pixelVector();
    const paa = new AFF.Paa();

    try {
        // place Uint8Array into pixelVector
        pixelVector.resize(uint8array.length, 0);
        for (let i = 0; i < uint8array.length; i++) {
            pixelVector.set(i, uint8array[i]);
        }

        // actually read paa data
        paa.readPaaData(pixelVector, false);

        /**
         * Holds lzoCompressed, height, width, dataLength and data
         */
        const mipmap = paa.mipMaps.get(0);

        // place data from mipmap into Uint8ClampedArray
        const uint8ClampedArray = new Uint8ClampedArray(mipmap.data.size());
        for (let i = 0; i < mipmap.data.size(); i++) {
            uint8ClampedArray[i] = mipmap.data.get(i);
        }

        const imageData = new ImageData(uint8ClampedArray, mipmap.width, mipmap.height);

        // cleanup
        pixelVector.delete();
        paa.delete();

        return imageData;
    } catch (err) {
        // cleanup
        pixelVector.delete();
        paa.delete();

        AFF.getExceptionMessage(err);
        throw err;
    }
}

addEventListener('message', async (event: MessageEvent) => {
    const file = event.data as File;

    const imageData = await convertPaaToImage(file);

    postMessage(imageData, this);
});
