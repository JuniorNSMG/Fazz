// ==========================================
// FAZZ - Service Worker
// PWA Offline-First Strategy
// ==========================================

const CACHE_NAME = 'fazz-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Arquivos para cachear na instalação
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/css/main.css',
  '/src/js/config.js',
  '/src/js/supabase.js',
  '/src/js/auth.js',
  '/src/js/tasks.js',
  '/src/js/ui.js',
  '/src/js/app.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando arquivos estáticos');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao cachear arquivos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Deletar caches antigos
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deletando cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Estratégia de Fetch: Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar URLs específicas (como Supabase)
  if (request.url.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta for válida, cachear uma cópia
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar (offline), buscar do cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Se for navegação e não tiver no cache, mostrar página offline
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background Sync (para sincronizar tarefas quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    console.log('[SW] Sincronizando tarefas em background...');
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Aqui você pode adicionar lógica para sincronizar tarefas pendentes
  // quando o usuário voltar a ficar online
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_TASKS',
        message: 'Sincronizando tarefas...'
      });
    });
  } catch (error) {
    console.error('[SW] Erro ao sincronizar tarefas:', error);
  }
}

// Notificações Push (para lembretes futuros)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Você tem uma tarefa pendente',
    icon: '/src/assets/icons/icon-192.png',
    badge: '/src/assets/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Fazz', options)
  );
});

// Click em Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, focar nela
        for (let client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }

        // Caso contrário, abrir nova janela
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url);
        }
      })
  );
});

console.log('[SW] Service Worker carregado');
