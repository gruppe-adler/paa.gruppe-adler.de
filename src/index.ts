import GradPaaApplication from './Application';
import './styles/global.scss';

window.addEventListener('DOMContentLoaded', async () => {
    const app = new GradPaaApplication();

    handleFiles(app);

    installServiceWorker(app);
});

function handleFiles(app: GradPaaApplication) {
    if (!('launchQueue' in window)) return;

    window.launchQueue.setConsumer(async launchParams => {
        // Nothing to do when the queue is empty.
        if (!launchParams.files.length) return;

        const files = await Promise.all(launchParams.files.map(handle => handle.getFile()));

        app.convertFiles(...files);
    });
}

async function installServiceWorker(app: GradPaaApplication) {
    if (!('serviceWorker' in navigator)) return;

    const hasController = navigator.serviceWorker.controller !== null;

    navigator.serviceWorker.register('/service-worker.js').then(() => {
        // If we did have a controller, the page was already offline ready
        if (!hasController) app.showSnackbar('Ready to work offline');
    });

    // If we didn't have a controller, we don't need to check for updates,
    // because we've just loaded from the network.
    if (hasController) {
        checkForUpdate().then(async sw => {
            if (sw === null) return;

            const result = await app.showSnackbar('Update available', { actions: ['reload', 'dismiss'] });
            if (result === 'reload') sw.postMessage('skip-waiting');
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => { window.location.reload(); });
    }
}

async function checkForUpdate(): Promise<ServiceWorker|null> {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration === undefined) return null;

    if (registration.waiting !== null) return registration.waiting;

    return new Promise(resolve => {
        registration.addEventListener('updatefound', async () => {
            // If updatefound is fired, it means that there's a new service worker being installed.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            registration.installing!.addEventListener('statechange', e => {
                const sw = e.target as ServiceWorker;

                if (sw.state === 'installed') resolve(registration.waiting);
            }, { once: true });
        });
    });
}
