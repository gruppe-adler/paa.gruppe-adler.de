import { Alert } from '@/ui/Alert';
import discordImageUrl from '@/assets/img/discord.svg';
import githubImageUrl from '@/assets/img/github.svg';

/**
 * Controller of drag-drop overlay.
 */
export default class FeedbackController extends EventTarget {
    constructor() {
        super();

        const link = document.querySelector('footer > a:last-child') as HTMLAnchorElement|null;
        if (link === null) throw new Error('Couldn\'t find feedback link element.');

        link.addEventListener('click', e => this.showPopup(e));
    }

    private showPopup(event: MouseEvent) {
        event.preventDefault();

        new Alert('', `
            <p>We hope your overall experience was good, but we are open to any criticism you have.</p>
            <p>We cannot possibly test every PAA edge case so we would appreciate if you report any bugs you encounter while converting from/to PAA.</p>
            <p>Join our discord server to chat directly with us, open an issue on GitHub or shoot us an email:</p>
            <div id="grad-paa-feedback">
                <a href="https://discord.gg/ZDqp45q" target="_blank" rel="noreferrer">
                    <img alt="" src="${discordImageUrl}" width="48" height="48">
                    <span>Discord<span>
                </a>
                <a href="https://github.com/gruppe-adler/paa.gruppe-adler.de/issues/new/choose" target="_blank" rel="noreferrer">
                    <img alt="" src="${githubImageUrl}" width="48" height="48">
                    <span>GitHub</span>
                </a>
                <a href="mailto:derzade@gruppe-adler.de" target="_blank" rel="noreferrer">
                    <i class="material-icons" aria-hidden="true">mail_outline</i>
                    <span>Email</span>
                </a>
            </div>
            <style>
                #grad-paa-feedback {
                    display: grid;
                    grid-column-gap: 1rem;
                    grid-auto-flow: column;
                    justify-items: center;
                    margin-top: 3rem;
                }

                #grad-paa-feedback a {
                    display: flex;
                    grid-row-gap: .5rem;
                    flex-direction: column;
                    align-items: center;
                    color: var(--color-text);
                    opacity: 0.75;
                    transition: opacity 0.05s ease-in-out;
                }

                #grad-paa-feedback a:hover {
                    text-decoration: none;
                    opacity: 1;
                }
                
                #grad-paa-feedback a > i {
                    font-size: 48px;
                }

                #grad-paa-feedback a > img {
                    width: 3rem;
                    filter: invert(100%);
                }

                @media (prefers-color-scheme: dark) {
                    #grad-paa-feedback > a > img {
                        filter: unset;
                    }
                }
            </style>
        `, { width: '650px' });
    }
}
