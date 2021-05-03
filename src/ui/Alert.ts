import { Dialog } from './Dialog';

export class Alert extends Dialog {
    constructor(content: string, options?: { width: string }) {
        const contentEl = document.createElement('div');
        contentEl.innerHTML = content;

        super(contentEl, { actions: [] });

        this.dialogElement.style.width = options?.width ?? '600px';
    }
}
