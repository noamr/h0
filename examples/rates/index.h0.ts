import { Document, Element, H0Spec } from "../../src/h0";
import {reconcileChildren, objectModel, selectView} from "../../src/reconcile";

interface Model {
    from: string
    to: string
    symbols: {[key: string]: string}
    rates: {[key: string]: number}
}

export async function renderView(response: Response, root: HTMLElement) {
    const {from, to, symbols, rates} = await response.json() as Model;
    root.querySelector("#from")!.innerHTML = from;

    root.querySelector("#to")!.innerHTML = to;
    reconcileChildren({
        model: objectModel(symbols),
        view: selectView(root.querySelector("select#symbols")!)
    });

    reconcileChildren({
        model: objectModel(rates),
        view: selectView(root.querySelector("select#rates")!)
    });
}

export async function fetchModel() : Promise<Response> {
    return new Response(JSON.stringify({rates: {USD: 1, GBP: 2}, symbols: {USD: "US Dollar $", GBP: "Brittish Pound"}, from: "USD", to: "GBP"}), {headers: {"Content-Type": "application/json"}});
}

export function selectRoot(doc: Document) { return doc.querySelector("main") as Element; }

export const scope = "/rates/";