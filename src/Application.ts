import * as JSZip from 'jszip';

import OverlayController, { OverlayConvertEvent } from '@/ui/controllers/OverlayController';
import HomeController from '@/ui/controllers/HomeController';
import FileListController from '@/ui/controllers/FileListController';
import FeedbackController from '@/ui/controllers/FeedbackController';
import ConversionService from '@/conversion/Service';
import SnackbarController, { SnackbarOptions } from './ui/controllers/SnackbarController';
import { download } from './utils/file';

export default class GradPaaApplication {
    private overlayController: OverlayController;
    private homeController: HomeController;
    private fileListController: FileListController;
    private snackbarController: SnackbarController;
    private inputElement: HTMLInputElement;

    constructor() {
        // OVERLAY CONTROLLER
        this.overlayController = new OverlayController();
        this.overlayController.addEventListener('convert', (e: OverlayConvertEvent) => {
            ConversionService.getInstance().convertFiles(...e.filesToConvert);
        });

        // HOME CONTROLLER
        const homeElem = document.getElementById('grad-paa-home');
        if (homeElem === null) throw new Error('Couldn\'t find home element.');
        this.homeController = new HomeController(homeElem);
        this.homeController.addEventListener('convert-files', () => this.openInput());

        // INPUT
        this.inputElement = this.setupInput();

        // FILE LIST CONTROLLER
        const fileListElem = document.getElementById('grad-paa-file-list');
        if (fileListElem === null) throw new Error('Couldn\'t find file list element.');
        this.fileListController = new FileListController(fileListElem);
        this.fileListController.addEventListener('convert-more', () => this.openInput());
        this.fileListController.addEventListener('download-all', async () => {
            this.fileListController.toggleDownloadAllSpinner(true);

            const zip = new JSZip();
            const files = ConversionService.getInstance().entries();
            for (const [, file] of files) {
                if (file.state !== 'done') continue;
                // TODO: we should tell the user if some files are not "done"

                zip.file(file.newName, file.result?.blob);
            }

            const blob = await zip.generateAsync({ type: 'blob' });

            this.fileListController.toggleDownloadAllSpinner(false);

            download({ blob, name: 'gruppe_adler_paa.zip' });
        });
        this.fileListController.addEventListener('delete-all', () => {
            const entries = ConversionService.getInstance().entries();

            for (const [id] of entries) {
                ConversionService.getInstance().cancelID(id);
            }
        });

        // FEEDBACK CONTROLLER
        new FeedbackController();

        this.snackbarController = new SnackbarController();

        /**
         * Toggle between home and file list, depending on if the ConversionService has files or not.
         */
        const toggleBetweenHomeAndFiles = () => {
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
        input.accept = 'image/png,image/svg+xml,image/jpeg,.paa';
        input.multiple = true;
        input.style.display = 'none';

        input.addEventListener('change', () => {
            if (!input.files) return;

            const files = Array.from(input.files);
            ConversionService.getInstance().convertFiles(...files);

            // remove all files from input
            input.value = '';
        });

        return input;
    }

    /**
     * Open main input
     */
    private openInput () {
        this.inputElement.click();
    }

    public async showSnackbar (msg: string, options?: SnackbarOptions): Promise<string> {
        return this.snackbarController.showSnackbar(msg, options);
    }
}
