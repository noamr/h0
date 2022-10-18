import {createListUpdater} from "../src/list";

interface Model {
    to: string;
    from: string;
    symbols: {[key: string]: string};
    rates: [[string, number]];
}

const updateSymbolList = createListUpdater<Model["symbols"][keyof Model["symbols"]], HTMLOptionElement, HTMLSelectElement>({
    viewSelector: "select#symbols",
    keyAttribute: "value",
    modelSchema: "object",
    itemTagName: "option",
    updateItem: (element, value) => { element.innerHTML = value; }
});

const updateRateList = createListUpdater<Model["rates"][keyof Model["rates"]], HTMLOptionElement, HTMLSelectElement>({
    viewSelector: "select#rates",
    keyAttribute: "value",
    modelSchema: "object",
    itemTagName: "option",
    updateItem: (element, value) => { element.innerHTML = value + " USD"; }
});

export async function render(response: Response, root: HTMLElement) {
    const {from, to, symbols, rates} = await response.json();
    console.log(root.outerHTML)
    root.querySelector("#from")!.innerHTML = from;
    root.querySelector("#to")!.innerHTML = to;
    updateSymbolList(root, symbols);
    updateRateList(root, rates);
}
