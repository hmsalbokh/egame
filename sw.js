const CACHE = 'efun-v4';
const ASSETS = [
  './index.html',
  './landing.html',
  './teacher-guide.html',
  './platformer.html',
  './gamification.css',
  './gamification.js',
  './speech-helper.js',
  './game-data.js',
  './game-data-s2.js',
  './game-data-s4.js',
  './game-data-s6.js',
  './stages.js',
  './manifest.json',
  './phaser.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(()=>caches.match('./index.html'))));
});
