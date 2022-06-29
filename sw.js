/* eslint-disable no-restricted-globals */
const VERSION = 'COPIv0.1';

self.addEventListener('install', event => {
  event.waitUntil(precache());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // get
  if (request.method !== 'GET') {
    return;
  }

  // look in cache
  event.respondWith(cachedResponse(request));

  // update cache
  event.waitUntil(updateCache(request));
});

async function precache() {
  const cache = await caches.open(VERSION);
  return cache.addAll([
    '/',
    '/index.html',
    '/libs/long-press-event.min.js',
    '/assets/add.svg',
    '/assets/arrow_back.svg',
    '/assets/checklist_select.svg',
    '/assets/close.svg',
    '/assets/delete_forever.svg',
    '/assets/done.svg',
    '/assets/hamburger.svg',
    '/assets/help.svg',
    '/assets/label.svg',
    '/assets/note.svg',
    '/assets/restore_from_trash.svg',
    '/assets/search.svg',
    '/assets/touch_app.svg',
    '/assets/touch.svg',
    '/assets/trashCan.svg',
    '/assets/twitter.svg',

  ]);
}

async function cachedResponse(request) {
try{
  const cache = await caches.open(VERSION);
  const response = await cache.match(request);
  return response || fetch(request);
}catch(err){
  console.log(err);
}
}

async function updateCache(request) {
  try{
  const cache = await caches.open(VERSION);
  const response = await fetch(request);
  return cache.put(request, response);
}catch(err){
  console.log(err);
}
}
