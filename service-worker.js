importScripts("/precache-manifest.9432ced52c34b5b0ca4e60c39eb65360.js", "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

if (workbox) {
    console.log(`Workbox is loaded`);
    workbox.precaching.precacheAndRoute(self.__precacheManifest);
    
    workbox.routing.registerRoute(
        ({url}) => url.origin === 'https://fonts.googleapis.com',
        workbox.strategies.staleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
    );

    // Cache the underlying font files with a cache-first strategy for 1 year.
    workbox.routing.registerRoute(
        ({url}) => url.origin === 'https://fonts.gstatic.com',
        workbox.strategies.cacheFirst({ cacheName: 'google-fonts-webfonts' })
    );
} else {
    console.log(`Workbox didn't load`);
}

