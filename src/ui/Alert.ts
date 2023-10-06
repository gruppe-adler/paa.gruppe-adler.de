import { Dialog } from './Dialog';

export class Alert extends Dialog {
    constructor (heading: string, content: string | HTMLDivElement, options?: { width: string }) {
        let contentEl: HTMLDivElement;

        if (typeof content === 'string') {
            contentEl = document.createElement('div');
            contentEl.innerHTML = content;
        } else {
            contentEl = content;
        }

        super(heading, contentEl, { actions: [] });

        if (this.dialogElement !== null) this.dialogElement.style.width = options?.width ?? '600px';
    }
}
