declare module '@/assets/convert.worker.js' {
    export default class ConvertWorker {
        /**
         * Generate a image from an paa file object
         * @param {File} file Paa file
         * @returns {Promise<ImageData>} Image Data
         */
        public convertPaaToImage(file: File): Promise<ImageData>;

        /**
         * Generate a paa from an ImageData object
         * @param {ImageData} data image data
         * @returns {Promise<Blob>} the paa as a blob
         */
        public convertImageToPaa(data: ImageData): Promise<Blob>;
        
        /**
         * Terminate worker
         */
        public terminate(): void;
    }
}
  