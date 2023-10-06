import EventTarget from '@ungap/event-target'; // Polyfill for Safari 13

/**
 * OverlayConvertEvent is an event the OverlayController emits, when files are dropped onto the overlay.
 * The event includes the dropped files.
 */
export class OverlayConvertEvent extends Event {
    public readonly filesToConvert: File[];

    constructor (fileList: FileList, init?: EventInit) {
        super('convert', init);

        this.filesToConvert = Array.from(fileList);
    }
}

/**
 * Check whether drag event contains any files
 * @param event Drag event
 */
const dragEventContainsFiles = (event: DragEvent): boolean => {
    if (event.dataTransfer && event.dataTransfer.types) {
        for (let i = 0; i < event.dataTransfer.types.length; i++) {
            if (event.dataTransfer.types[i] === 'Files') {
                return true;
            }
        }
    }

    return false;
};

/**
 * Controller of drag-drop overlay.
 */
export default class OverlayController extends EventTarget {
    private readonly overlayElement: HTMLElement;
    private dragTimeOut: number | null = null;

    constructor () {
        super();

        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'grad-paa-overlay';
        document.body.appendChild(this.overlayElement);

        this.toggleOverlay(false);

        document.body.addEventListener('dragover', e => { this.onDrag(e); });

        this.overlayElement.addEventListener('drop', e => { this.onDrop(e); });
        this.overlayElement.addEventListener('dragover', e => { e.preventDefault(); });
    }

    /**
     * Dragover event listener for document's body.
     * Show's / hide's overlay while files are dragged over body.
     * @param event Drag event
     */
    private onDrag (event: DragEvent) {
        if (!dragEventContainsFiles(event)) return;

        this.toggleOverlay(true);
        if (this.dragTimeOut !== null) window.clearTimeout(this.dragTimeOut);
        this.dragTimeOut = window.setTimeout(() => { this.toggleOverlay(false); }, 100);
    }

    /**
     * Drop event listener for overlay element
     * @param event Drag event
     */
    private onDrop (event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        if (!dragEventContainsFiles(event)) return;

        // dragEventContainsFiles checks if there is a dataTransfer containing files
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.dispatchEvent(new OverlayConvertEvent(event.dataTransfer!.files));
    }

    /**
     * Toggle (show / hide) overlay element
     * @param isShown whether to show or hide element
     */
    private toggleOverlay (isShown: boolean) {
        if (isShown) {
            this.overlayElement.classList.add('grad-paa-overlay--shown');
        } else {
            this.overlayElement.classList.remove('grad-paa-overlay--shown');
        }
    }
}
