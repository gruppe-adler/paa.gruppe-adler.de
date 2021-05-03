import setupAFF from '@/utils/aff';

/**
 * Generate a paa from an ImageData object
 * @param {ImageData} data image data
 * @returns {Promise<Blob>} the paa as a blob
 */
async function convertImageToPaa (data: ImageData): Promise<Blob> {
    const AFF = await setupAFF();
    const { data: uint8ClampedArray, width, height } = data;

    // eslint-disable-next-line new-cap
    const pixelVector = new AFF.pixelVector();
    const paa = new AFF.Paa();
    const mipMaps = new AFF.MipMaps();

    let paaData;

    try {
        // place data from array into pixel vector
        pixelVector.resize(uint8ClampedArray.length, 0);
        for (let i = 0; i < uint8ClampedArray.length; i++) {
            pixelVector.set(i, uint8ClampedArray[i]);
        }

        // create mipMap and place it into the paa
        const mipMap = {
            height,
            width,
            data: pixelVector,
            dataLength: pixelVector.size(),
            lzoCompressed: false
        };
        mipMaps.push_back(mipMap);
        paa.mipMaps = mipMaps;

        paa.calculateMipmapsAndTaggs();
        paaData = paa.writePaaData(AFF.TypeOfPaX.UNKNOWN);
    } catch (err) {
        // cleanup
        pixelVector.delete();
        paa.delete();
        mipMaps.delete();

        throw err;
    }

    // place data from paa into Uint8Array
    const uint8array = new Uint8Array(paaData.size());
    for (let i = 0; i < paaData.size(); i++) {
        uint8array[i] = paaData.get(i);
    }
    // cleanup
    pixelVector.delete();
    paa.delete();
    mipMaps.delete();
    paaData.delete();
    return new Blob([uint8array.buffer], { type: 'application/octet-stream' });
}

addEventListener('message', async (event: MessageEvent) => {
    const imageDate = event.data as ImageData;

    const blob = await convertImageToPaa(imageDate);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    postMessage(blob, this!);
});
