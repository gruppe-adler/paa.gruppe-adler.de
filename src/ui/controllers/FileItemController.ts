import ConversionFile from '@/conversion/File';
import ConversionService from '@/conversion/Service';
import { Alert } from '@/ui/Alert';

export default class FileItemController {
    private readonly file: ConversionFile;
    private readonly element: HTMLLIElement;

    private moreMenuHandler: null|((this: Window, ev: MouseEvent) => void) = null;

    /**
     * Click callback for main actions
     */
    private mainActionCallback: null|((this: FileItemController, ev: MouseEvent) => void) = null;

    constructor(file: ConversionFile, list: HTMLUListElement) {
        this.file = file;

        this.element = document.createElement('li');
        list.appendChild(this.element);
        this.initialRender();

        this.file.addEventListener('update', () => this.render());
    }

    /**
     * Called only by constructor and handles everything required for initial render, besides actually creating the element.
     * This includes adding the correct css classes, setting up all required click-handlers and adding all "static" innerHTML.
     */
    private initialRender() {
        this.element.classList.add('grad-paa-file-item');

        this.element.innerHTML = `
            <i class="material-icons-round grad-paa-file-item__icon">insert_photo</i>
            <span class="grad-paa-file-item__name">
                <span>${this.file.newName}</span>
                <span style="opacity: 0.5; margin-left: .5rem;">from ${this.file.name}</span>
            </span>
            <div class="grad-paa-file-item__main-action"></div>
            <div class="grad-paa-file-item__more">
                <i class="material-icons-round">more_vert</i>
                <ul></ul>
            </div>
        `;

        this.element.querySelector('.grad-paa-file-item__more > i').addEventListener('click', () => this.toggleMoreMenu(true));
        this.element.querySelector('.grad-paa-file-item__main-action').addEventListener('click', (e: MouseEvent) => {
            if (this.mainActionCallback === null) return;
            this.mainActionCallback(e);
        });

        this.render();
    }

    /**
     * Show / hide the more menu, which is the menu hidden behind the three dots
     * @param shown Whether to show or hide the menu
     */
    private toggleMoreMenu(shown: boolean) {
        const ul = this.element.querySelector('.grad-paa-file-item__more > ul') as HTMLUListElement|null;
        if (ul === null) throw new Error('Couldn\'t find list element');

        if (shown) {
            // show more menu (default transform is "scale(0)")
            ul.style.transform = 'scale(1)';

            if (this.moreMenuHandler === null) {
                /**
                 * Hide more menu if clicked anywhere within window, but the more-menu
                 */
                this.moreMenuHandler = (event: MouseEvent) => {
                    const list = this.element.querySelector('.grad-paa-file-item__more > ul') as HTMLUListElement|null;
                    if (!list || !event.target) return;
                    const target = event.target as HTMLElement;

                    // we don't want to hide more menu, if user clicked on list / element within in list
                    if (target === list || list.contains(target)) return;

                    event.preventDefault();
                    event.stopPropagation();
                    this.moreMenuHandler = null;
                    this.toggleMoreMenu(false);
                };

                // add handler only after timeout, to make sure the click event won't trigger the event directly
                window.setTimeout(
                    () => window.addEventListener('click', this.moreMenuHandler, { once: true, capture: true }),
                    50
                );
            }
        } else {
            // hide more menu (default transform is "scale(0)")
            ul.style.transform = '';

            window.removeEventListener('click', this.moreMenuHandler);
            this.moreMenuHandler = null;
        }
    }

    /**
     * Called by initial render and whenever the file updates.
     * Render everything depending on the file's status.
     */
    private render() {
        this.element.querySelectorAll('.grad-paa-file-item__message').forEach(x => x.remove());

        const moreActions: HTMLLIElement[] = [];

        switch (this.file.state) {
        case 'warning':
            {
                this.setMainActionIcon('warning', 'warning', 'Show Warning', this.showWarning);

                const msg = document.createElement('div');
                msg.className = 'grad-paa-file-item__message';
                msg.style.color = 'var(--color-warning)';
                msg.innerHTML = `<span>${this.file.warning.displayText}</span><i class="material-icons-round" style="font-size: 0.95em; vertical-align: middle; cursor: pointer; opacity: 0.5; margin-left: .2em;">help</i>`;
                msg.querySelector('i').addEventListener('click', () => this.showWarning());
                this.element.appendChild(msg);

                moreActions.push(
                    this.createAction('Show Warning', 'visibility', this.showWarning),
                    this.createAction('Delete', 'delete', this.cancel)
                );
            }
            break;
        case 'error':
            {
                this.setMainActionIcon('error', 'error', 'Show Error', this.showError);

                const msg = document.createElement('div');
                msg.className = 'grad-paa-file-item__message';
                msg.style.color = 'var(--color-error)';
                msg.innerHTML = 'An error occurred. Click <span style="text-decoration: underline; cursor: pointer;" data-grad-paa>here</span> to see the details.';
                msg.querySelector('span').addEventListener('click', () => this.showError());
                this.element.appendChild(msg);

                moreActions.push(
                    this.createAction('Show Error', 'visibility', this.showError),
                    this.createAction('Delete', 'delete', this.cancel)
                );
            }
            break;
        case 'done':
            this.setMainActionIcon('get_app', 'primary', 'Download', this.download);

            moreActions.push(
                this.createAction('Download', 'get_app', this.download),
                this.createAction('Delete', 'delete', this.cancel)
            );
            break;
        case 'loading':
            {
                const loader = document.createElement('div');
                loader.className = 'grad-paa-loader';
                this.setMainAction(loader, 'Converting File');

                moreActions.push(
                    this.createAction('Cancel', 'clear', this.cancel)
                );
            }
            break;
        case 'queued':
            this.setMainActionIcon('hourglass_empty', 'text', 'Queued');

            moreActions.push(
                this.createAction('Prioritize', 'priority_high', this.prioritize),
                this.createAction('Cancel', 'clear', this.cancel)
            );
            break;
        case 'setup':
            moreActions.push(
                this.createAction('Cancel', 'clear', this.cancel)
            );
            break;
        }

        const list = this.element.querySelector('.grad-paa-file-item__more > ul') as HTMLUListElement|null;
        if (!list) return;
        list.innerHTML = '';
        for (const action of moreActions) {
            list.appendChild(action);
        }
    }

    /**
     * Render main action icon
     * @param icon Icon
     * @param color Icon color
     * @param tooltip Main action tooltip
     * @param callback Callback, which is executed on click
     */
    private setMainActionIcon (icon: string, color: string, tooltip = '', callback?: () => void) {
        const i = document.createElement('i');
        i.innerHTML = icon;
        i.className = 'material-icons-round';
        i.setAttribute('aria-label', tooltip);
        i.setAttribute('style', `color: var(--color-${color});`);

        this.setMainAction(i, tooltip, callback);
    }

    /**
     * Render main action
     * @param el Main action element
     * @param tooltip Main action tooltip
     * @param callback Callback, which is executed on click
     */
    private setMainAction (el: HTMLElement, tooltip?: string, callback?: () => void) {
        const container = this.element.querySelector('.grad-paa-file-item__main-action') as HTMLDivElement|null;
        if (!container) return;

        // clear container
        container.innerHTML = '';

        if (tooltip !== undefined && tooltip.length > 0) {
            container.classList.add('grad-paa-tooltip');
            container.style.setProperty('--grad-paa-tooltip', `"${tooltip}"`);
        } else {
            container.classList.remove('grad-paa-tooltip');
        }

        this.mainActionCallback = callback || null;
        if (callback !== undefined) {
            container.style.cursor = 'pointer';
        } else {
            container.style.cursor = '';
        }

        container.appendChild(el);
    }

    /**
     * Helper function to create action for more menu
     * @param displayName Display name of action
     * @param icon Material icon
     * @param callback Callback, which will be called upon click
     * @returns Created HTML element
     */
    private createAction (displayName: string, icon: string, callback: (this: FileItemController, ev: MouseEvent) => void): HTMLLIElement {
        const li = document.createElement('li');

        li.innerHTML = `
            <i class="material-icons-round" aria-hidden="true">${icon}</i>
            <span>${displayName}</span>
        `;

        li.addEventListener('click', e => {
            this.toggleMoreMenu(false);
            callback.bind(this)(e);
        });

        return li;
    }

    /**
     * Download the file
     */
    private download () {
        this.file.download();
    }

    /**
     * Prioritize the file
     */
    private prioritize () {
        ConversionService.getInstance().prioritizeID(this.file.id);
    }

    /**
     * Cancel the file
     */
    private cancel () {
        ConversionService.getInstance().cancelID(this.file.id);
    }

    /**
     * Show error to user
     */
    private showError () {
        if (this.file.error === null) return;

        // TODO: Add button "report error", which opens feedback popup instead of asking user to open manually
        new Alert(`
            <p>The following error occurred, while trying to convert your file:</p>
            <pre style="padding: .5rem; background-color: rgba(0,0,0,0.1); color: var(--color-error); border-radius: .25rem; white-space: break-spaces;">${this.file.error}</pre>
            <p>Please help us make this tool even better and report the issue, by <b>clicking the "Feedback"-Button</b> in the lower right corner of the page!</p>
        `);
    }

    /**
     * Show warning to user
     */
    private showWarning () {
        if (this.file.warning === null) return;

        new Alert(this.file.warning.description);
    }

    /**
     * Remove file item with a fancy animation
     */
    public remove (): void {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.element.remove();
            return;
        }

        const { height } = this.element.getBoundingClientRect();

        this.element.style.maxHeight = `${height}px`;
        this.element.style.transition = 'all .2s ease';
        this.element.style.overflowY = 'hidden';
        this.element.style.minHeight = 'initial';

        // double RAF to make sure the styles are only applied
        // after the ones above are applied
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                this.element.style.maxHeight = '0px';
                this.element.style.paddingBottom = '0px';
                this.element.style.paddingTop = '0px';
                this.element.style.marginBottom = '0px';
                this.element.style.opacity = '0';

                window.setTimeout(() => {
                    this.element.remove();
                }, 300);
            });
        });
    }
}
