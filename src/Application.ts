import * as JSZip from 'jszip';

import OverlayController, { type OverlayConvertEvent } from '@/ui/controllers/OverlayController';
import HomeController from '@/ui/controllers/HomeController';
import FileListController from '@/ui/controllers/FileListController';
import ConversionService from '@/conversion/Service';
import SnackbarController, { type SnackbarOptions } from './ui/controllers/SnackbarController';
import { download } from './utils/file';
import { acceptField } from './utils/mime';

export default class GradPaaApplication {
    private readonly overlayController: OverlayController;
    private readonly homeController: HomeController;
    private readonly fileListController: FileListController;
    private readonly snackbarController: SnackbarController;
    private readonly inputElement: HTMLInputElement;

    constructor () {
        // OVERLAY CONTROLLER
        this.overlayController = new OverlayController();
        this.overlayController.addEventListener('convert', (e: OverlayConvertEvent) => {
            void ConversionService.getInstance().convertFiles(...e.filesToConvert);
        });

        // HOME CONTROLLER
        const homeElem = document.getElementById('grad-paa-home');
        if (homeElem === null) throw new Error('Couldn\'t find home element.');
        this.homeController = new HomeController(homeElem);
        this.homeController.addEventListener('convert-files', () => { this.openInput(); });

        // INPUT
        this.inputElement = this.setupInput();

        // FILE LIST CONTROLLER
        const fileListElem = document.getElementById('grad-paa-file-list');
        if (fileListElem === null) throw new Error('Couldn\'t find file list element.');
        this.fileListController = new FileListController(fileListElem);
        this.fileListController.addEventListener('convert-more', () => { this.openInput(); });
        this.fileListController.addEventListener('download-all', () => {
            this.fileListController.toggleDownloadAllSpinner(true);

            const zip = new JSZip();
            const files = ConversionService.getInstance().entries();
            for (const [, file] of files) {
                if (file.state !== 'done') continue;
                // result will be present, because we just checked if the file was done
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                zip.file(file.newName, file.result!.blob);
            }

            void zip.generateAsync({ type: 'blob' })
                .finally(() => { this.fileListController.toggleDownloadAllSpinner(false); })
                .then(blob => { download({ blob, name: 'gruppe_adler_paa.zip' }); });
        });
        this.fileListController.addEventListener('delete-all', () => {
            const entries = ConversionService.getInstance().entries();

            for (const [id] of entries) {
                ConversionService.getInstance().cancelID(id);
            }
        });

        this.snackbarController = new SnackbarController();

        /**
         * Toggle between home and file list, depending on if the ConversionService has files or not.
         */
        const toggleBetweenHomeAndFiles = (): void => {
            const filesShown = ConversionService.getInstance().length > 0;
            this.homeController.toggle(!filesShown);
            this.fileListController.toggle(filesShown);
        };

        ConversionService.getInstance().addEventListener('added', toggleBetweenHomeAndFiles);
        ConversionService.getInstance().addEventListener('removed', toggleBetweenHomeAndFiles);
    }

    /**
     * Used within constructor. Helper method to create and setup main input element
     * @returns {HTMLInputElement} Created input element
     */
    private setupInput (): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'file';
        void acceptField().then(accept => { input.accept = accept; });
        input.multiple = true;
        input.style.display = 'none';

        input.addEventListener('change', () => {
            if (!input.files) return;

            const files = Array.from(input.files);
            void ConversionService.getInstance().convertFiles(...files);

            // remove all files from input
            input.value = '';
        });
        document.body.append(input);

        return input;
    }

    /**
     * Open main input
     */
    private openInput (): void {
        this.inputElement.click();
    }

    public async showSnackbar (msg: string, options?: SnackbarOptions): Promise<string> {
        return await this.snackbarController.showSnackbar(msg, options);
    }
}
