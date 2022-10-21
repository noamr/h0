import {mapModelToListView, objectModel, selectView} from "../../src/list";

interface Model {
    from: string
    to: string
    symbols: {[key: string]: string}
    rates: {[key: string]: number}
}

export async function render(response: Response, root: HTMLElement) {
    const {from, to, symbols, rates} = await response.json() as Model;
    root.querySelector("#from")!.innerHTML = from;
    root.querySelector("#to")!.innerHTML = to;
    mapModelToListView({
        model: objectModel(symbols),
        view: selectView(root.querySelector("select#symbols")!)
    });

    mapModelToListView({
        model: objectModel(rates),
        view: selectView(root.querySelector("select#rates")!)
    });
}

export async function route(request: Request) : Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/rates"))
        throw new Error(`Unexpected URL ${request.url}`);
        
    return new Response(JSON.stringify({rates: {USD: 1, GBP: 2}, symbols: {USD: "US Dollar $", GBP: "Brittish Pound"}, from: "USD", to: "GBP"}), {headers: {"Content-Type": "application/json"}});
}

export function selectRoot(doc: Document) { return doc.querySelector("main"); }
export const scope = "/rates";
export const options = {
    updates: "client",
    firstPass: "server"
}