import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import * as googleAnalytics from 'workbox-google-analytics';

declare const self: ServiceWorkerGlobalScope;

// ------------------------------------------------------------------------------------------
// Precaching configuration
// ------------------------------------------------------------------------------------------
cleanupOutdatedCaches();

// Precaching
// Make sure that all the assets passed in the array below are fetched and cached
// The empty array below is replaced at build time with the full list of assets to cache
// This is done by workbox-build-inject.js for the production build
const assetsToCache = self.__WB_MANIFEST;

precacheAndRoute(assetsToCache);

// ------------------------------------------------------------------------------------------
// General stuff
// ------------------------------------------------------------------------------------------
googleAnalytics.initialize();

addEventListener('message', event => {
    switch (event.data) {
    case 'skip-waiting':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        skipWaiting();
        break;
    }
});
