const CACHE_NAME = 'shift-scheduler-v8';

const APP_SHELL = [
  './',
  './index.html',
  './main.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {

  if(event.request.method !== 'GET'){
    return;
  }

  const url =
    new URL(event.request.url);

  /*
   * HTML / JS / Service Worker
   * 使用网络优先策略。
   *
   * 这样 GitHub 更新后，
   * 手机不会长期卡在旧版本。
   */
  if(
    url.origin === location.origin &&
    (
      url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('/main.js') ||
      url.pathname.endsWith('/sw.js')
    )
  ){

    event.respondWith(

      fetch(event.request)

        .then(response => {

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache =>
              cache.put(
                event.request,
                copy
              )
            );

          return response;
        })

        .catch(() =>
          caches
            .match(event.request)
            .then(response =>
              response ||
              caches.match('./index.html')
            )
        )
    );

    return;
  }

  /*
   * 其他静态资源：
   * 缓存优先，网络兜底。
   */
  event.respondWith(

    caches
      .match(event.request)

      .then(cached => {

        if(cached){
          return cached;
        }

        return fetch(event.request)

          .then(response => {

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  event.request,
                  copy
                )
              );

            return response;
          });
      })

      .catch(() =>
        caches.match('./index.html')
      )
  );
});
