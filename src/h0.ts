export type RouteFunction = (req: Request) => Promise<Response | null>;
export type RenderFunction = (res: Response, root: HTMLElement) => Promise<void>;
export type RootFunction = (doc: Document) => HTMLElement;
export type ReduceFunction = (res: Response, prevResponse: Response | null) => Promise<Response>;
interface H0Options {
    serviceWorker: boolean;
    ssr: boolean;
}

interface Differ {
    diff(callback: ((model: {[key: string]: any}) => ((root: HTMLElement) => void))): void;
    list(callback: (model: {[key: string]: any}) => void, view: () => ({
        list: HTMLElement;
        itemTemplate: HTMLTemplateElement;
        renderItem: (model: any, element: HTMLElement) => void;
    })): void;
}

interface Model {[key: string]: any};

export interface H0Spec {
    router: string;
    renderer: string;
    rootSelector: string;
    scope: string;
    options?: H0Options;
}

export async function initClient({router, renderer, rootSelector, scope, options}: H0Spec, window: Window) {
    const {document} = window;
    let previousResponse : Response | null = null;
    const rootElement = document.querySelector(rootSelector) as HTMLElement;

    if (!rootElement)
        throw new Error(`Element ${rootSelector} not found`);

    const rendererPromise = import(renderer);
    let waitForServer: Promise<any> = Promise.resolve();
    if (options?.serviceWorker) {
        const swURL = new URL(scope, location.href);
        swURL.searchParams.set("h0-view", location.href);
        swURL.searchParams.set("h0-router", router);
        waitForServer = navigator.serviceWorker.register(swURL.href, {scope, type: "module"}).then(reg => reg.active);
    }

    function handle(req: Request): boolean {
        const {pathname} = new URL(req.url);
        if (!pathname.startsWith(scope))
            return false;

        (async() => {
            await waitForServer;
            let response = await fetch(req);
            if (!response)
                location.href = req.url;
            (await rendererPromise).render(response, rootElement);
        })();

        return true;
    }

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

    handle(new Request(location.pathname.startsWith(scope) ? location.pathname : scope));
}
