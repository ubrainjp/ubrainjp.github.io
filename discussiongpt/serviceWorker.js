self.addEventListener('install', (event) => {
  console.log('service worker install ...');
});
self.addEventListener('activate', (event) => {
console.info('activate', event);
});
self.addEventListener('fetch', function(event) {
});


