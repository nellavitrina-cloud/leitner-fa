'use strict';
const CACHE_NAME = 'vazhe-vazhe-v4';
const ASSETS = ['./index.html','./leitner-fa.html','./manifest.json','./cards.js','./core.js','./app.js','./icon-192.png','./icon-512.png','./fonts/Vazir-Regular.woff2','./fonts/Vazir-Bold.woff2'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vazhe-vazhe-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Bump CACHE_NAME on every release to keep cached assets consistent.
  const assetURL = event.request.mode === 'navigate' && !url.pathname.endsWith('/leitner-fa.html') ? new URL('./index.html',self.registration.scope).href : url.href;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(assetURL)) || fetch(event.request)));
});


