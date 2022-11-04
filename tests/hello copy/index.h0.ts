import {reconcileChildren, objectModel, selectView} from "../../src/reconcile";

interface Model {
    text: string
    list: {a: string, b: string},
    runtime: string
};

export async function render(response: Response, root: HTMLElement) {
    const {text, list, runtime} = await response.json() as Model;
    root.querySelector("output#text")!.innerHTML = text;
    root.querySelector("span.runtime")!.innerHTML = runtime;
    reconcileChildren({
        view: {
            container: root.querySelector("ul#list") as HTMLUListElement,
            updateItem: (item, v) => {item.innerHTML = v; },
            createItem: (d: Document) => d.createElement("li"),
            keyAttribute: "data-key"
        },
        model: objectModel(list)
    })
}

export async function route() : Promise<Response> {
    return new Response(JSON.stringify({text:  "Text from model", runtime: typeof window === "undefined" ? "node" : "client", list: {a: "A", b: "B"}}));
}

export async function mount(root: HTMLElement, {window, h0}: {window: Window, h0: Navigator}) {
    const response = await fetch("/hello/text.txt");
    const text = await response.text();
    root.querySelector(".mount")!.innerHTML = text;
}

export function selectRoot(doc: Document) { return doc.querySelector("main") as Element; }

export const scope = "/hello/";
