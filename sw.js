/*
 * Service Worker - 使网页能够离线使用
 * 当用户首次访问时缓存资源，之后即使没有网络也能访问
 */

const CACHE_NAME = 'feedback-form-v2';
const ASSETS_TO_CACHE = [
    './',
    './辅导反馈2026.4.10.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 安装事件 - 缓存资源
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 缓存资源中...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] 资源缓存完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] 缓存失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker 激活中...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] 删除旧缓存:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker 激活完成');
                return self.clients.claim();
            })
    );
});

// 请求拦截 - 从缓存返回或网络请求
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[SW] 从缓存返回:', event.request.url);
                    return cachedResponse;
                }

                console.log('[SW] 从网络获取:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('[SW] 已缓存新资源:', event.request.url);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] 网络请求失败:', error);
                    });
            })
    );
});

console.log('[SW] Service Worker 脚本加载完成');