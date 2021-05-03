import ConversionEvent from '@/conversion/Event';
import ConversionService from '@/conversion/Service';
import { Choice } from '../Choice';
import FileItemController from './FileItemController';

export default class FileListController extends EventTarget {
    private element: HTMLElement;
    private downloadAllBtn: HTMLButtonElement;
    private fileControllers: Map<string, FileItemController> = new Map();

    constructor(fileListElem: HTMLElement) {
        super();
        this.element = fileListElem;

        const convertMoreBtn = this.element.querySelector('[data-grad-paa-convert-more]');
        convertMoreBtn?.addEventListener('click', () => { this.dispatchEvent(new Event('convert-more')); });
        convertMoreBtn?.removeAttribute('data-grad-paa-convert-more');

        const downloadAllBtn = this.element.querySelector('[data-grad-paa-download-all]') as HTMLButtonElement;
        downloadAllBtn.addEventListener('click', () => { this.dispatchEvent(new Event('download-all')); });
        downloadAllBtn.removeAttribute('data-grad-paa-download-all');
        this.downloadAllBtn = downloadAllBtn;

        const deleteAllBtn = this.element.querySelector('[data-grad-paa-delete-all]');
        deleteAllBtn?.addEventListener('click', () => this.deleteAll());
        deleteAllBtn?.removeAttribute('data-grad-paa-delete-all');

        ConversionService.getInstance().addEventListener('added', (e: ConversionEvent) => {
            const list = this.element.querySelector('ul') as null|HTMLUListElement;

            if (list === null) return;

            this.fileControllers.set(e.file.id, new FileItemController(e.file, list));
            this.checkDownloadAllButton();
        });

        ConversionService.getInstance().addEventListener('removed', (e: ConversionEvent) => {
            const id = e.file.id;

            if (!this.fileControllers.has(id)) return;

            const controller = this.fileControllers.get(id);
            controller?.remove();

            this.fileControllers.delete(id);

            this.checkDownloadAllButton();
        });

        ConversionService.getInstance().addEventListener('update', () => this.checkDownloadAllButton());
        this.checkDownloadAllButton();
    }

    /**
     * Click callback for "delete all" button
     */
    private async deleteAll() {
        const choice = new Choice(
            `
                <h2 style="font-family: 'Source Sans Pro', sans-serif">Delete all files?</h2>
                <p>This will cancel any running / pending conversions and delete the results of all already converted files.</p>
            `,
            {
                text: 'Delete All',
                color: 'var(--color-error)',
                primary: true
            }
        );

        choice.promise.then(val => {
            if (!val) return;
            this.dispatchEvent(new Event('delete-all'));
        });
    }

    /**
     * Hide / Show "Download All"-Button depending on if there are any files to download
     */
    private checkDownloadAllButton() {
        let hasFilesToDownload = false;
        const files = ConversionService.getInstance().entries();
        for (const [, file] of files) {
            if (file.state === 'done') {
                hasFilesToDownload = true;
                break;
            }
        }

        if (hasFilesToDownload) {
            this.downloadAllBtn.style.display = '';
        } else {
            this.downloadAllBtn.style.display = 'none';
        }
    }

    public toggle (shown: boolean): void {
        if (shown) {
            this.element.style.display = '';
        } else {
            this.element.style.display = 'none';
        }
    }

    public toggleDownloadAllSpinner (shown: boolean): void {
        if (shown) {
            this.downloadAllBtn.classList.add('grad-paa-btn--loader');
        } else {
            this.downloadAllBtn.classList.remove('grad-paa-btn--loader');
        }
    }
}
