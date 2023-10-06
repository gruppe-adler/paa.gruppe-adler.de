import EventTarget from '@ungap/event-target'; // Polyfill for Safari 13

import { Choice } from '@/ui/Choice';
import { getFileExtension, getFileNameWithoutExtension, type GradPaaFile } from '@/utils/file';
import ConversionEvent from './Event';
import ConversionFile from './File';

class Queue<T> {
    private readonly arr: T[] = [];

    public enqueue (item: T): number {
        return this.arr.push(item);
    }

    public dequeue (): T | null {
        return this.arr.shift() || null;
    }

    public remove (item: T): T | null {
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
    private static instance: ConversionService | null = null;
    private readonly files = new Map<string, ConversionFile>();
    private readonly takenIds = new Set<string>();
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
    public async convertFiles (...newFiles: File[]): Promise<void> {
        if (newFiles.length === 0) return;

        // takenNames is a map containing file-names as keys and the file-id as value
        const takenNames = new Map(Array.from(this.files).map(([k, v]) => [v.name, k]));
        let remainingFilesWithTakenNames = newFiles.filter(({ name }) => takenNames.has(name)).length;
        let resultForAll: null | boolean | undefined;

        for (const f of newFiles) {
            const file: GradPaaFile = { blob: f, name: f.name };

            if (takenNames.has(file.name)) {
                remainingFilesWithTakenNames--;
                const extension = getFileExtension(file.name);
                const baseName = getFileNameWithoutExtension(file.name);

                // generate name to rename to
                let num = 2;
                let newName = `${baseName}_${num}.${extension}`;
                while (takenNames.has(newName)) {
                    num++;
                    newName = `${baseName}_${num}.${extension}`;
                }

                let result: boolean | null;
                if (resultForAll === undefined) {
                    const el = document.createElement('div');
                    let applyForAll = false;

                    el.innerHTML = `<p>Do you want to replace the existing file or rename the new file "${newName}".</p>`;

                    if (remainingFilesWithTakenNames > 0) {
                        el.innerHTML = el.innerHTML + `
                            <p style="display: flex; align-items: center; margin-top: .5rem; margin-bottom: -1rem;">
                                <input type="checkbox" style="margin-left: 0;" />
                                <label>Do this for all current items</label>
                            </p>`;

                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        el.querySelector('input')!.addEventListener('change', e => { applyForAll = (e.target as HTMLInputElement).checked; });
                    }

                    result = await Choice.new(
                        `"${file.name}" already exists`,
                        el,
                        { text: 'Replace', color: 'var(--color-error)', primary: true },
                        { text: 'Rename' },
                        { text: 'Skip' }
                    );

                    if (applyForAll) resultForAll = result;
                } else {
                    result = resultForAll;
                }

                switch (result) {
                    case null:
                    // Skip
                        continue;
                    case true:
                    // Replace
                        {
                        // we checked this a few lines above
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            const existingId = takenNames.get(file.name)!;
                            this.cancelID(existingId);
                        }
                        break;
                    case false:
                    // Rename
                        file.name = newName;
                        break;
                }
            }

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
    public entries (): IterableIterator<[string, ConversionFile]> {
        return this.files.entries();
    }
}
