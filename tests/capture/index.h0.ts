interface Model {
    path: string
    method: string
};

export async function renderView(response: Response, root: HTMLElement) {
    const {path, method} = await response.json() as Model;
    root.querySelector("output#path")!.innerHTML = path;
    root.querySelector("output#method")!.innerHTML = method;
    const outRenders = root.querySelector("output#renders")!;
    const renders = +(outRenders.innerHTML || "0");
    outRenders.innerHTML = "" + (renders + 1);
}

export async function fetchModel(req: Request) : Promise<Response> {
    const path = new URL(req.url).pathname;
    const method = req.method;
    return new Response(JSON.stringify({path, method}));
}

export function selectRoot(doc: Document) { return doc.querySelector("main") as Element; }

export const scope = "/capture/";

export function mount() {}