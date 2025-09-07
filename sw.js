const CACHE_NAME = 'smartcount-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/menu.js',
  '/favicon.svg',
  '/manifest.json',
  // Recursos externos essenciais
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://unpkg.com/@supabase/supabase-js@2'
];

// Instalar o service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Service Worker: Erro ao fazer cache:', err);
      })
  );
});

// Ativar o service worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Estratégia: Cache First para recursos estáticos
  if (event.request.url.includes('.css') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.svg') || 
      event.request.url.includes('font-awesome')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retorna do cache se encontrado
          if (response) {
            return response;
          }
          // Senão, busca na rede
          return fetch(event.request)
            .then(response => {
              // Verifica se a resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clona a resposta
              const responseToCache = response.clone();
              
              // Adiciona ao cache
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  }
  // Estratégia: Network First para API calls (Supabase)
  else if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se a rede funciona, retorna a resposta
          return response;
        })
        .catch(() => {
          // Se offline, retorna uma resposta de fallback
          return new Response(
            JSON.stringify({ 
              error: 'Aplicação offline. Algumas funcionalidades podem não estar disponíveis.' 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }
          );
        })
    );
  }
  // Para outras requisições, usa a estratégia padrão
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});

// Mostrar notificação quando app é atualizado
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronização em background (para futuras implementações)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Sincronização em background');
    // Implementar sincronização de dados offline
  }
});