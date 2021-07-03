const template = document.createElement('template');
template.innerHTML = `
    <div class="grad-paa-dialog__backdrop"></div>
    <div class="grad-paa-dialog__dialog">
        <h2 class="grad-paa-dialog__heading"></h2>
        <button class="grad-paa-dialog__close grad-paa-btn--not-responsive">
            <i class="material-icons-round">cancel</i>
        </button>
        <div class="grad-paa-dialog__actions"></div>
    </div>
`;

export class Dialog {
    protected element: HTMLElement;

    constructor(heading: string, content: HTMLDivElement, options?: { close?: boolean, actions?: HTMLElement[] }) {
        this.element = document.createElement('div');
        this.element.className = 'grad-paa-dialog';

        this.element.appendChild(template.content.cloneNode(true));
        document.body.appendChild(this.element);

        // double RAF to make sure, that the element is rendered before the "shown" class
        // is added. This will ensure that the animation will actually trigger
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                this.element.classList.add('grad-paa-dialog--shown');
            });
        });

        if (heading.length > 0) {
            const el = this.element.querySelector('.grad-paa-dialog__heading');

            if (el !== null) el.textContent = heading;
        } else {
            this.element.querySelector('.grad-paa-dialog__heading')?.remove();
        }

        if (options?.close === false) {
            this.element.querySelector('.grad-paa-dialog__close')?.remove();
        } else {
            this.element.querySelector('.grad-paa-dialog__close')?.addEventListener('click', () => this.close());
            this.element.querySelector('.grad-paa-dialog__backdrop')?.addEventListener('click', () => this.close());
        }

        content.classList.add('grad-paa-dialog__content');

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const actionsContainer = this.element.querySelector('.grad-paa-dialog__actions')!;

        this.element.querySelector('.grad-paa-dialog__dialog')?.insertBefore(content, actionsContainer);

        const actions = options?.actions ?? [];
        for (const el of actions) {
            actionsContainer.appendChild(el);
        }
        if (actions.length === 0) {
            actionsContainer.remove();
        }
    }

    protected get dialogElement (): HTMLElement|null {
        return this.element.querySelector('.grad-paa-dialog__dialog');
    }

    public close(): void {
        this.element.classList.remove('grad-paa-dialog--shown');

        window.setTimeout(() => {
            this.element.remove();
        }, 400);
    }
}
