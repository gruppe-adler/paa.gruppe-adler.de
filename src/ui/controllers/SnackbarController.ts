export interface SnackbarOptions {
    timeout?: number
    actions?: string | [string, string]
    color?: string
}

export default class SnackbarController {
    private readonly wrapper: HTMLDivElement;

    constructor () {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'grad-paa-snackbar-container';

        document.body.appendChild(this.wrapper);
    }

    public async showSnackbar (message: string, options: SnackbarOptions = {}): Promise<string> {
        const el = document.createElement('div');
        el.className = 'grad-paa-snackbar grad-paa-snackbar--enter-leave';
        const timeout = options.timeout ?? (options.actions === undefined ? 5000 : 0);
        const actions = options.actions ?? ['Dismiss'];

        const msgNode = document.createElement('span');
        msgNode.innerHTML = message;
        el.appendChild(msgNode);

        this.wrapper.appendChild(el);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                el.classList.remove('grad-paa-snackbar--enter-leave');
            });
        });

        return await new Promise<string>(resolve => {
            const close = (val: string): void => {
                el.classList.add('grad-paa-snackbar--enter-leave');
                window.setTimeout(() => { el.remove(); }, 1000);
                resolve(val);
            };

            for (const action of actions) {
                const btn = document.createElement('button');
                btn.innerText = action.toUpperCase();
                el.appendChild(btn);

                btn.addEventListener('click', () => { close(action); });
            }

            if (timeout > 0) {
                window.setTimeout(
                    () => { close('dismiss'); },
                    timeout
                );
            }
        });
    }
}
