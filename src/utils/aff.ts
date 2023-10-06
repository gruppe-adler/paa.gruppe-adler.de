/* eslint-disable camelcase, @typescript-eslint/no-unused-vars */
const NULL_POINTER = 0;

interface AFFExports extends WebAssembly.Exports {
    encode: (width: number, height: number, data: number, size: number) => number
    free_encoded_data: (ptr: number) => 0 | 1
    decode: (data: number, dataSize: number, width: number, height: number, size: number) => number
    get_last_aff_exception: () => number
    free: (ptr: number) => number
    malloc: (size: number) => number
    __errno_location: () => number
}

interface AFFOptions {
    exit?: (exitCode: number) => unknown
}

export class AFFNotReadyError extends Error {
    public readonly name = 'AFFNotReadyError';

    constructor () {
        super('AFF not ready yet. Remember awaiting the "aff.ready" promise, before accessing any methods or properties.');
    }
}

const AFF_EXCEPTION_MSGS = new Map<number, string>([
    [0, 'OK'],
    [-1, 'Unknown Error'],
    [-2, 'Read Error'],
    [-3, 'Argument Error'],
    [-4, 'Invalid State'],
    [-5, 'IO Error'],
    [-6, 'Compression Error'],
    [-7, 'Invalid State']
]);

export class AFFExceptionError extends Error {
    constructor (code: number) {
        const message = AFF_EXCEPTION_MSGS.get(code) ?? 'Unknown Error Code';

        super(`${message} (Code: ${code})`);

        this.name = 'AFFExceptionError';
    }
}

// Safari still can't handle WebAssembly.instantiateStreaming...
async function instantiateWA (response: Response | PromiseLike<Response>, importObject?: WebAssembly.Imports): Promise<WebAssembly.Instance> {
    if (WebAssembly.instantiateStreaming !== undefined) {
        const { instance } = await WebAssembly.instantiateStreaming(response, importObject);
        return instance;
    }

    const bytes = await (await response).arrayBuffer();
    const source = await WebAssembly.instantiate(bytes, importObject);
    return source.instance;
}

export class AFF {
    private dataView: DataView;
    private instance: WebAssembly.Instance | null = null;
    private readonly memory: WebAssembly.Memory;
    public readonly ready: Promise<void>;

    /**
     * @param {Response|PromiseLike<Response>} input (Promise that resolves to) Response, which includes WASM Module
     * @param {AFFOptions} options Options
     */
    constructor (input: Response | PromiseLike<Response>, options?: AFFOptions) {
        this.memory = new WebAssembly.Memory({ initial: 256, maximum: 32768 });
        this.dataView = new DataView(this.memory.buffer);

        this.ready = instantiateWA(
            input,
            {
                env: {
                    memory: this.memory,
                    /**
                     * Get information about a file or directory, given a path
                     * @param {number} pathPtr The path of the file or directory that you want information about. (char *)
                     * @param {number} bufferPtr A pointer to a buffer where the function can store the information (struct stat64 *)
                     * @returns {0|-1} 0 = Success / -1 = An error occurred (errno is set).
                     */
                    __sys_stat64: (pathPtr: number, bufferPtr: number): 0 | -1 => {
                        this.setErrNo(5); // EIO: Input/output error
                        return -1;
                    },

                    /**
                     * Called when memory has grown. In a JS runtime, this is used to know when to update the JS views
                     * on the wasm memory, which otherwise we would need to constantly check for after any wasm code
                     * runs. See [this wasi discussion](https://github.com/WebAssembly/WASI/issues/82).
                     * @param {number} index Which memory has grown
                     */
                    emscripten_notify_memory_growth: (index: number) => { this.updateViews(); }
                },
                wasi_snapshot_preview1: {
                    /**
                     * Read from a file descriptor
                     * @param {number} fd File descriptor
                     * @param {number} iov
                     * @param {number} iovcnt
                     * @param {number} pnum
                     * @returns {0|-1} 0 = Success / -1 = An error occurred (errno is set).
                     */
                    fd_read: (fd: number, iov: number, iovCount: number, pnum: number): 0 | -1 => {
                        this.setErrNo(5); // EIO: Input/output error
                        return -1;
                    },

                    /**
                     * Lose a file descriptor
                     * @param {number} fd File descriptor
                     * @returns {0|-1} 0 = Success / -1 = An error occurred (errno is set).
                     */
                    fd_close: (fd: number): 0 | -1 => {
                        this.setErrNo(5); // EIO: Input/output error
                        return -1;
                    },

                    /**
                     * Reposition read/write file offset
                     * @param {number} fd File descriptor
                     * @param {number} offsetLow
                     * @param {number} offsetHigh
                     * @param {number} whence
                     * @param {number} newOffset
                     * @returns {0|-1} 0 = Success / -1 = An error occurred (errno is set).
                     */
                    fd_seek: (fd: number, offsetLow: number, offsetHigh: number, whence: number, newOffset: number): 0 | -1 => {
                        this.setErrNo(5); // EIO: Input/output error
                        return -1;
                    },

                    /**
                     * Write to a file descriptor
                     * @param {number} fd File descriptor
                     * @param {number} iov
                     * @param {number} iovCount
                     * @param {number} pnum
                     * @returns {0|-1} 0 = Success / -1 = An error occurred (errno is set).
                     */
                    fd_write: (fd: number, iov: number, iovCount: number, pnum: number): 0 | -1 => {
                        this.setErrNo(5); // EIO: Input/output error
                        return -1;
                    },

                    /**
                     * Return command-line argument data sizes.
                     * @param {number} penvironCount (Output pointer) The number of arguments.
                     * @param {number} penvironBufferSize (Output pointer) The size of the argument string data.
                     * @returns {0}
                     */
                    environ_sizes_get: (penvironCountPtr: number, penvironBufferSizePtr: number): 0 | -1 => {
                        this.dataView.setInt32(penvironCountPtr, 0, true);
                        this.dataView.setInt32(penvironBufferSizePtr, 0, true);
                        return 0;
                    },
                    environ_get: (environ: number, environBufferPtr: number) => {
                        return 0;
                    },

                    /**
                     * Called on program exit
                     * @param {number} exitCode Exit code
                     */
                    proc_exit: (exitCode: number): void => {
                        options?.exit?.(exitCode);
                    }
                }
            }
        ).then(instance => {
            this.instance = instance;
            this.updateViews();
        });
    }

    private get exports (): AFFExports | null {
        return this.instance?.exports as AFFExports;
    }

    /**
     * Update this.dataView. This is called once initially, when the WASM loads
     * and every time memory grows / shrinks and therefore the underlying memory
     * buffer changes.
     */
    private updateViews (): void {
        this.dataView = new DataView(this.memory.buffer);
    }

    /**
     * Allocate memory block
     * @param {number} size Size of the memory block, in bytes.
     * @returns {number} This function returns a pointer to the allocated memory.
     */
    private malloc (size: number): number {
        if (this.exports === null) throw new AFFNotReadyError();

        const ptr = this.exports.malloc(size);
        if (ptr === NULL_POINTER) throw new Error('Failed to allocate memory');

        return ptr;
    }

    /**
     * Deallocate memory previously allocated
     * @param {number} ptr This is the pointer to a memory block previously allocated
     */
    private free (ptr: number): void {
        if (this.exports === null) throw new AFFNotReadyError();

        this.exports.free(ptr);
    }

    /**
     * Write buffer to memory. This will automatically allocate memory.
     * You should remember to free the memory after you're done using it.
     * @param {ArrayBufferLike} buffer
     * @returns {number} Pointer to the allocated memory.
     */
    private writeBufferToMemory (buffer: ArrayBufferLike): number {
        const ptr = this.malloc(buffer.byteLength);

        const arr = new Uint8Array(buffer);

        for (let i = 0; i < arr.length; i++) {
            this.dataView.setUint8(ptr + i, arr[i]);
        }

        return ptr;
    }

    /**
     * Copy from memory
     * @param {number} ptr Pointer to data
     * @param {number} size Size
     * @returns {Uint8Array}
     */
    private getBytesFromMemory (ptr: number, size: number): Uint8Array {
        return new Uint8Array(this.memory.buffer).slice(ptr, ptr + size);
    }

    /**
     * Set errno
     * @param errno errno
     */
    private setErrNo (errno: number): void {
        if (this.exports === null) throw new AFFNotReadyError();

        this.dataView.setInt32(this.exports.__errno_location(), errno);
    }

    /**
     * Return error, which corresponds to last thrown grad_aff exception
     * @returns Error according to last exception
     */
    private getLastAFFException (): AFFExceptionError {
        if (this.exports === null) throw new AFFNotReadyError();

        const num = this.exports.get_last_aff_exception();

        return new AFFExceptionError(num);
    }

    /**
     * Encode image data to PAA bytes
     * @param {ImageData} imageData Image data
     * @returns {Uint8Array} byte-encoded PAA
     *
     * @throws {@link AFFNotReadyError}
     * Thrown if this function is called before AFF instance is ready. (await the .ready promise to prevent this)
     *
     * @throws {@link AFFExceptionError}
     * Thrown if grad_aff implementation throws any exceptions.
     */
    public encode (imageData: ImageData): Uint8Array {
        if (this.exports === null) throw new AFFNotReadyError();

        const sizePtr = this.malloc(4);
        const imageDataPtr = this.writeBufferToMemory(imageData.data.buffer);

        const ptr = this.exports.encode(imageData.width, imageData.height, imageDataPtr, sizePtr);
        if (ptr === NULL_POINTER) throw this.getLastAFFException();

        const size = this.dataView.getUint32(sizePtr, true);
        const output = this.getBytesFromMemory(ptr, size);

        const success = this.exports.free_encoded_data(ptr);
        if (success === 0) throw this.getLastAFFException();
        this.free(sizePtr);
        this.free(imageDataPtr);

        return output;
    }

    /**
     * Encode PAA bytes to image data
     * @param {Uint8Array} data byte-encoded PAA
     * @returns {ImageData} image data
     *
     * @throws {@link AFFNotReadyError}
     * Thrown if this function is called before AFF instance is ready. (await the .ready promise to prevent this)
     *
     * @throws {@link AFFExceptionError}
     * Thrown if grad_aff implementation throws any exceptions.
     */
    public decode (data: Uint8Array): ImageData {
        if (this.exports === null) throw new AFFNotReadyError();

        const outputSizePtr = this.malloc(4);
        const widthPtr = this.malloc(2);
        const heightPtr = this.malloc(2);
        const dataPtr = this.writeBufferToMemory(data.buffer);

        const ptr = this.exports.decode(dataPtr, data.length, widthPtr, heightPtr, outputSizePtr);
        if (ptr === NULL_POINTER) throw this.getLastAFFException();

        const size = this.dataView.getUint32(outputSizePtr, true);
        const width = this.dataView.getUint16(widthPtr, true);
        const height = this.dataView.getUint16(heightPtr, true);
        const output = this.getBytesFromMemory(ptr, size);

        const image = new ImageData(new Uint8ClampedArray(output.buffer), width, height);

        this.free(outputSizePtr);
        this.free(widthPtr);
        this.free(heightPtr);
        this.free(dataPtr);

        return image;
    }
}

/**
 * @param {Request|RequestInfo|URL|Response|Promise<Response>} input
 */
export default async function init (input: Request | RequestInfo | URL | Response | Promise<Response> = '/grad_aff_paa.wasm', options?: AFFOptions): Promise<AFF> {
    if (typeof input === 'string' || input instanceof Request || input instanceof URL) {
        if (input instanceof URL) input = input.toString();

        input = fetch(input);
    }

    const initObj = new AFF(input, options);
    await initObj.ready;

    return initObj;
}
