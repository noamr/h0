/// <reference lib="webworker" />

import { RouteFunction } from "./h0";
export function initServiceWorker({route, self}: {route: RouteFunction, self: ServiceWorkerGlobalScope}) {
    self.addEventListener("fetch", event => {
        event.waitUntil((async() => {
            const response = await route(event.request);
            if (response)
                event.respondWith(response);
        })());
    });
}