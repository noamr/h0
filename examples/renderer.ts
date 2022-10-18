import {createListUpdater} from "../src/list";

interface Model {
    to: string;
    from: string;
    symbols: {[key: string]: string};
    rates: [[string, number]];
}

const updateSymbolList = createListUpdater<Model["symbols"][keyof Model["symbols"]], HTMLOptionElement, HTMLSelectElement>({
    keyAttribute: "value",
    modelSchema: "object",
    itemTagName: "option",
    updateItem: (element, value) => { element.innerHTML = value; }
});

const updateRateList = createListUpdater<Model["rates"][keyof Model["rates"]], HTMLOptionElement, HTMLSelectElement>({
    keyAttribute: "value",
    modelSchema: "object",
    itemTagName: "option",
    updateItem: (element, value) => { element.innerHTML = value + " USD"; }
});

export async function render(response: Response, root: HTMLElement) {
    const {from, to, symbols, rates} = await response.json();
    root.querySelector("#from")!.innerHTML = from;
    root.querySelector("#to")!.innerHTML = to;
    updateSymbolList(root.querySelector("select#symbols") as HTMLSelectElement, symbols);
    updateRateList(root.querySelector("select#rates") as HTMLSelectElement, rates);
}
