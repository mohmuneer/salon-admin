const CACHE        = 'glamour-admin-v1'
const OFFLINE_URL  = '/offline'
const PRECACHE     = ['/', '/offline', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function offlinePage() {
  return caches.match(OFFLINE_URL).then(
    (r) => r || new Response('<h1>أنت غير متصل بالإنترنت</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  )
}

function offlineJson() {
  return new Response(JSON.stringify({ error: 'offline' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  })
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  if (!url.protocol.startsWith('http')) return

  if (url.pathname === OFFLINE_URL) return

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => offlinePage())
    )
    return
  }

  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') {
      e.respondWith(fetch(request).catch(() => offlineJson()))
      return
    }
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !isDev) {
            try {
              const cacheClone = res.clone()
              caches.open(CACHE).then((c) => c.put(request, cacheClone))
            } catch (_) { }
          }
          return res
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || offlineJson())
        )
    )
    return
  }

  if (request.method !== 'GET') {
    e.respondWith(fetch(request).catch(() => new Response(null, { status: 503 })))
    return
  }

  if (isDev) {
    e.respondWith(fetch(request).catch(() => offlinePage()))
    return
  }

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            try {
              const cacheClone = res.clone()
              caches.open(CACHE).then((c) => c.put(request, cacheClone))
            } catch (_) { }
          }
          return res
        })
        .catch(() => offlinePage())
    })
  )
})
