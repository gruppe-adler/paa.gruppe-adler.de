import ConversionEvent from './Event';
import ConversionFile from './File';

class Queue<T> {
    private arr: T[] = [];

    public enqueue(item: T): number {
        return this.arr.push(item);
    }

    public dequeue(): T|null {
        return this.arr.shift() || null;
    }

    public remove (item: T): T|null {
        const index = this.arr.indexOf(item);
        if (index > -1) {
            this.arr.splice(index, 1);
            return item;
        }

        return null;
    }

    public moveToFront (item: T): void {
        this.remove(item);

        this.arr.unshift(item);
    }

    public get size (): number {
        return this.arr.length;
    }
}

const MAX_RUNNING_CONVERSIONS = 8;

export default class ConversionService extends EventTarget {
    private static instance: ConversionService|null = null;
    private readonly files: Map<string, ConversionFile> = new Map();
    private readonly takenIds: Set<string> = new Set();
    private readonly queue = new Queue<string>();
    private runningConversions = 0;

    /**
     * Singleton pattern getInstance method
     */
    public static getInstance (): ConversionService {
        if (ConversionService.instance === null) {
            ConversionService.instance = new ConversionService();
        }

        return ConversionService.instance;
    }

    /**
     * Add new files to convert
     * @param newFiles Files to convert
     */
    public convertFiles (...newFiles: File[]): void {
        if (newFiles.length === 0) return;

        for (const file of newFiles) {
            const id = this.generateID();
            const conversionFile = new ConversionFile(file, id);
            this.files.set(id, conversionFile);
            this.dispatchEvent(new ConversionEvent('added', conversionFile));
            conversionFile.addEventListener('preChecksDone', () => {
                this.queue.enqueue(id);
                this.run();
            }, { once: true });
            conversionFile.addEventListener('update', () => {
                this.dispatchEvent(new ConversionEvent('update', conversionFile));
            });
        }
    }

    /**
     * Cancel file by ID
     * @param id ID of conversion file to cancel
     */
    public cancelID (id: string): void {
        const file = this.files.get(id);

        if (!file) return;

        file.cancel();
        this.files.delete(id);
        this.queue.remove(id);

        this.dispatchEvent(new ConversionEvent('removed', file));
    }

    /**
     * Prioritize file by ID
     * @param id ID of conversion file to prioritize
     */
    public prioritizeID (id: string): void {
        const file = this.files.get(id);

        if (!file) return;

        this.queue.moveToFront(id);
    }

    /**
     * RUN
     */
    private run (): void {
        while (this.queue.size > 0 && this.runningConversions < MAX_RUNNING_CONVERSIONS) {
            // dequeue will return an item, because we just checked the size
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const id = this.queue.dequeue()!;
            const file = this.files.get(id);
            if (!file) continue;

            if (file.warning !== null) continue;

            this.runningConversions++;
            file.convert().finally(() => {
                this.runningConversions--;
                this.run();
            });
        }
    }

    /**
     * Generate ID for new file
     */
    private generateID (): string {
        let id = Math.random().toString(36).substr(2, 9);

        while (this.takenIds.has(id)) {
            id = Math.random().toString(36).substr(2, 9);
        }

        this.takenIds.add(id);

        return id;
    }

    /**
     * The length property returns the number of files currently handled by this service.
     */
    public get length (): number {
        return this.files.size;
    }

    /**
     * @returns Iterator for all files
     */
    public entries(): IterableIterator<[string, ConversionFile]> {
        return this.files.entries();
    }
}
