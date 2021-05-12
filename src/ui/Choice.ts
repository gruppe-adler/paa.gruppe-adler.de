import { Dialog } from './Dialog';

interface ChoiceButtonOptions {
    text: string;
    color?: string;
    primary?: true;
}

export class Choice extends Dialog {
    private resolve: (value: boolean | PromiseLike<boolean>) => void;
    public readonly promise: Promise<boolean>;

    constructor(heading: string, content: string, okOptions: ChoiceButtonOptions, cancelOptions: ChoiceButtonOptions = { text: 'Cancel' }, options?: { width: string }) {
        const contentEl = document.createElement('div');
        contentEl.innerHTML = content;

        const okBtn = Choice.generateButton(okOptions);
        const cancelBtn = Choice.generateButton(cancelOptions);

        super(heading, contentEl, { close: false, actions: [cancelBtn, okBtn] });

        this.promise = new Promise<boolean>(resolve => {
            this.resolve = resolve;
        });

        this.promise.finally(() => this.close());

        okBtn.addEventListener('click', () => this.resolve(true));
        cancelBtn.addEventListener('click', () => this.resolve(false));

        if (this.dialogElement !== null) this.dialogElement.style.width = options?.width ?? '600px';
    }

    private static generateButton(options: ChoiceButtonOptions): HTMLButtonElement {
        const btn = document.createElement('button');

        btn.innerHTML = options.text;
        btn.classList.add('grad-paa-btn--not-responsive');

        if (options.color !== undefined) btn.style.setProperty('--button-color', options.color);
        if (options.primary) btn.classList.add('grad-paa-btn--primary');

        return btn;
    }
}
