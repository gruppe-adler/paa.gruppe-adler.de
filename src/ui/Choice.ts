import { Dialog } from './Dialog';

interface ChoiceButtonOptions {
    text: string;
    color?: string;
    primary?: true;
}

export class Choice extends Dialog {
    private resolve: (value: boolean|null | PromiseLike<boolean|null>) => void;
    private keyUpEventHandler: (e: KeyboardEvent) => void;
    public readonly promise: Promise<boolean|null>;

    constructor(
        heading: string,
        content: string|HTMLDivElement,
        okOptions: ChoiceButtonOptions,
        cancelOptions: ChoiceButtonOptions = { text: 'Cancel' },
        skipOptions?: ChoiceButtonOptions,
        options?: { width?: string }
    ) {
        let contentEl: HTMLDivElement;
        if (typeof content === 'string') {
            contentEl = document.createElement('div');
            contentEl.innerHTML = content;
        } else {
            contentEl = content;
        }

        const okBtn = Choice.generateButton(okOptions);
        const cancelBtn = Choice.generateButton(cancelOptions);
        const actions = [cancelBtn, okBtn];

        if (skipOptions !== undefined) {
            const skipButton = Choice.generateButton(skipOptions);
            skipButton.addEventListener('click', () => this.resolve(null));
            actions.unshift(skipButton);
        }

        super(heading, contentEl, { close: false, actions });

        if (skipOptions !== undefined) {
            const el: HTMLDivElement|null = this.element.querySelector('.grad-paa-dialog__actions');
            if (el !== null) {
                el.style.justifySelf = 'stretch';
                el.style.gridTemplateColumns = '1fr auto auto';
                el.style.justifyItems = 'flex-start';
            }
        }

        this.promise = new Promise<boolean>(resolve => {
            this.resolve = resolve;
        });

        this.keyUpEventHandler = e => {
            if (e.key !== 'Enter') return;
            this.resolve(true);
        };
        window.addEventListener('keyup', this.keyUpEventHandler);

        this.promise.finally(() => { window.removeEventListener('keyup', this.keyUpEventHandler); this.close(); });

        okBtn.addEventListener('click', () => this.resolve(true));
        cancelBtn.addEventListener('click', () => this.resolve(false));

        if (this.dialogElement !== null) this.dialogElement.style.width = options?.width ?? '600px';
    }

    /**
     * Most of the time we don't need the actual Choice instance, but only the promise.
     * This is basically a constructor, but instead of the instance the pending promise is returned.
     */
    public static new (
        heading: string,
        content: string|HTMLDivElement,
        okOptions: ChoiceButtonOptions,
        cancelOptions: ChoiceButtonOptions = { text: 'Cancel' },
        skipOptions?: ChoiceButtonOptions,
        options?: { width: string }
    ): Promise<boolean|null> {
        const choice = new Choice(heading, content, okOptions, cancelOptions, skipOptions, options);

        return choice.promise;
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
