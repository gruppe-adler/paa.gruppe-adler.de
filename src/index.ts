import GradPaaApplication from './Application';
import './styles/global.scss';

window.addEventListener('DOMContentLoaded', async () => {
    const app = new GradPaaApplication();

    // TODO: remove return to enable service worker
    return;

    if (!('serviceWorker' in navigator)) return;

    const hasController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('/service-worker.js').then(() => {
        if (!hasController) app.showSnackbar('Ready to work offline');
    });

    // If we don't have a controller, we don't need to check for updates – we've just loaded from the
    // network.
    if (!hasController) return;

    const reg = await navigator.serviceWorker.getRegistration();
    // Service worker not registered yet.
    if (!reg) return;

    // Look for updates
    await updateReady(reg);

    const result = await app.showSnackbar('Update available', { actions: ['reload', 'dismiss'] });

    if (result === 'reload' && reg.waiting) reg.waiting.postMessage('skip-waiting');
});

/** Wait for an installing worker */
async function installingWorker(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
    if (reg.installing) return reg.installing;
    return new Promise<ServiceWorker>(resolve => {
        reg.addEventListener('updatefound', () => resolve(reg.installing), { once: true });
    });
}

/** Wait a service worker to become waiting */
async function updateReady(reg: ServiceWorkerRegistration): Promise<void> {
    if (reg.waiting) return;
    const installing = await installingWorker(reg);
    return new Promise<void>(resolve => {
        installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') resolve();
        });
    });
}
