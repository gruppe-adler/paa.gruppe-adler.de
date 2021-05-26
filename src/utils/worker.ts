/**
 * Promisify our workers, which are only built to process one request at a time.
 * @param worker Worker to promisify
 * @param message Message to send to worker
 * @param transfer Array of Transferable objects for the postMessage call
 * @returns Promise which resolves in the data received by the worker
 */
export function promisifyWorker<T, R>(worker: Worker, message: T, transfer?: Transferable[]): Promise<R> {
    let messageHandler: (e: MessageEvent<{ type: 'data', data: R }|{ type: 'error', data: Error }>) => void;
    let errorHandler: (e: ErrorEvent) => void;

    const promise = new Promise<R>((resolve, reject) => {
        messageHandler = e => {
            if (e.data.type === 'data') {
                resolve(e.data.data);
            } else {
                reject(e.data.data);
            }
        };
        errorHandler = e => reject(e);

        worker.addEventListener('message', messageHandler);
        worker.addEventListener('error', errorHandler);

        worker.postMessage(message, transfer ?? []);
    });

    promise.finally(() => {
        worker.removeEventListener('message', messageHandler);
        worker.removeEventListener('error', errorHandler);
    });

    return promise;
}
