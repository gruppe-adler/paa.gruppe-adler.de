import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
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
// Google Fonts
// ------------------------------------------------------------------------------------------
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts-web-fonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200]
            }),
            new ExpirationPlugin({
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 30
            })
        ]
    })
);

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
