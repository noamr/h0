export type RouteFunction = (req: Request) => Promise<Response | null>;
export type RenderFunction = (res: Response, root: HTMLElement) => Promise<void>;
export type RootFunction = (doc: Document) => HTMLElement;
export type ReduceFunction = (res: Response, prevResponse: Response | null) => Promise<Response>;
export type Handler = (req: Request) => boolean;
interface H0Options {
    firstPass: "server" | "client" | "manual"
    updates: "server" | "client" | "worker" | "none"
}

export interface H0Spec {
    router: string;
    renderer: string;
    rootSelector: string;
    scope: string;
    options: H0Options;
}

let waitForServer: Promise<any> = Promise.resolve();

export function initServiceWorker({scope, router}: H0Spec) {
    const swURL = new URL(scope, location.href);
    swURL.searchParams.set("h0-view", location.href);
    swURL.searchParams.set("h0-router", router);
    waitForServer = (async () => {
        const reg = await navigator.serviceWorker.register(swURL.href, {scope, type: "module"})
        await reg.active;
    })();
}

export function captureEvents(rootElement: HTMLElement, handle: Handler) {
    rootElement.addEventListener("submit", (event: SubmitEvent) => {
        const form = event.target as HTMLFormElement;
        let body : FormData | null = new FormData(form);
        const isGet = form.method.toUpperCase() === "GET";
        let action = form.action;
        if (isGet) {
            const url = new URL(action);
            for (const [k, v] of body)
                url.searchParams.append(k, v.toString());
            action = url.href;
            body = null;
        }

        const request = new Request({url: action, method: form.method} as RequestInfo, {body});
        if (!handle(request))
            event.preventDefault();
    }, {capture: true});

    rootElement.addEventListener("click", async (event: MouseEvent) => {
        if (!(event.target instanceof HTMLAnchorElement))
            return;
        const {href} = event.target as HTMLAnchorElement;
        if (!handle(new Request(href)))
            event.preventDefault();
    }, {capture: true});
}

export function createHandler({renderer, scope, router, options}: H0Spec, rootElement: Element) {
    const rendererPromise = import(renderer);

    return (req: Request) => {
        const {pathname} = new URL(req.url);
        if (!pathname.startsWith(scope))
            return false;

        (async() => {
            await waitForServer;
            const response = await ((options.updates === "client" ? (await import(router)) : fetch)(req));
            if (!response)
                location.href = req.url;
            (await rendererPromise).render(response, rootElement);
        })();

        return true;
    }
}

export async function clientPass({scope}: H0Spec, handle: Handler, {location}: Window) {
    handle(new Request(location.pathname.startsWith(scope) ? location.href : scope));
}

export function initClient(spec: H0Spec, {document, location}: Window) {
    const rootElement = document.querySelector(spec.rootSelector) as HTMLElement;
    if (!rootElement)
        throw new Error(`Root element ${spec.rootSelector} not found`);

    if (spec.options.updates !== "none") {
        const handler = createHandler(spec, rootElement!);
        captureEvents(rootElement, handler);
        clientPass(spec, handler, window);
    }

}