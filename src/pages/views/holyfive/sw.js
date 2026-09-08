// Holy Five Service Worker - wersja 1.0.0
const CACHE_NAME = 'holyfive-cache-v1';
const urlsToCache = [
  '/',
  '/pages/views/holyfive/holyfive.html',
  '/features/holyfive/holyfive.css',
  '/features/holyfive/holyfive.js',
  '/pages/views/holyfive/hflogo5.webp',
  '/pages/views/holyfive/logohftop.webp',
  '/pages/views/holyfive/holyfive.ico',
  '/pages/views/holyfive/flash.webp',
  '/pages/views/holyfive/manifest.webmanifest'
];

// Instalacja service workera i cachowanie podstawowych zasobów
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Otwarty cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Obsługa żądań sieciowych
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Zwraca rezultat z cache jeśli istnieje
        if (response) {
          return response;
        }
        
        // Jeśli nie ma w cache, pobierz z sieci
        return fetch(event.request)
          .then(response => {
            // Sprawdź czy odpowiedź jest poprawna
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Sklonuj odpowiedź, ponieważ ciało może być użyte tylko raz
            const responseToCache = response.clone();
            
            // Otwórz cache i zapisz odpowiedź
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(() => {
            // Jeśli sieć zawiedzie, spróbuj pokazać stronę offline
            if (event.request.mode === 'navigate') {
              return caches.match('/pages/views/holyfive/holyfive.html');
            }
          });
      })
  );
});

// Aktualizacja service workera - usunięcie starych cache'y
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Usuń stare cache
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
