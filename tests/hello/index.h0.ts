import {reconcileChildren, objectModel} from "../../src/reconcile";

interface Model {
    text: string
    list: {a: string, b: string},
    runtime: string
};

export async function renderView(response: Response, root: HTMLElement) {
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

export async function fetchModel() : Promise<Response> {
    return new Response(JSON.stringify({text:  "Text from model", runtime: typeof window === "undefined" ? "node" : "client", list: {a: "A", b: "B"}}));
}

export async function mount(root: HTMLElement) {
    const response = await fetch("/hello/text.txt");
    const text = await response.text();
    root.querySelector(".mount")!.innerHTML = text;
}

export function selectRoot(doc: Document) { return doc.querySelector("main") as Element; }

export const scope = "/hello/";
