const listAcounting = new WeakMap<Element, Map<string, Element>>();
type UpdateItemFunc<V, ItemElement extends Element = Element> = (element: ItemElement, value: V, key: string) => void;
type CreateItemFunc<ItemElement extends Element = Element> = (document: Document) => ItemElement;

interface ListUpdaterParams<V, ItemElement extends Element = Element, ListElement extends Element = Element> {
    modelSchema?: "object" | "array" | "entries" | ((v : V, i: number) => string) | ((e: [string, V], i: number) => string);
    keyAttribute: string;
    createItem?: HTMLTemplateElement | CreateItemFunc<ItemElement>;
    itemTagName?: string;
    updateItem: UpdateItemFunc<V, ItemElement>;
    viewSelector: string | ((root: HTMLElement) => ListElement);
}

export function createListUpdater<V, ItemElement extends Element = Element, ListElement extends Element = Element>(params: ListUpdaterParams<V, ItemElement, ListElement>) {
    let {createItem, itemTagName, modelSchema, updateItem, keyAttribute, viewSelector} = params;

    if (!createItem) {
        if (itemTagName)
            createItem = (document: Document) => document.createElement(itemTagName!) as Element as ItemElement;
        else
            throw new TypeError("createItem or itemTagName required");
    }

    if (typeof viewSelector === "string") {
        const selector = viewSelector as string;
        viewSelector = (root: HTMLElement) => root.querySelector(selector)!;
    };

    if ("tagName" in createItem && (createItem as Element).tagName === "TEMPLATE")
        createItem = () => (createItem as HTMLTemplateElement).content.firstElementChild?.cloneNode(true) as ItemElement;

    let transformModel = (a: any) => a;
    let keyGetter = modelSchema;
    let valueGetter : ((v : V) => V) | ((e: [string, V]) => V) = (v: V) => v;

    switch (modelSchema) {
        case "object":
            transformModel = (model: {[key: string]: V}) => Object.entries(model);
        case "entries":
            keyGetter = ([k, v]: [string, V]) => k;
            valueGetter = ([k, v]: [string, V]) => v;
            break;
        case "array":
            keyGetter = (v: V, i: number) => String(i);
            break;
    }

    if (typeof createItem !== "function" || typeof keyGetter !== "function" || typeof valueGetter !== "function" || typeof updateItem !== "function")
        throw new TypeError("Invalid createItem");

    const accounting = new WeakMap<ListElement, Map<string, ItemElement>>();

    return (root: HTMLElement, model: IterableIterator<V>) => {
        const view = (viewSelector as (root: HTMLElement) => ListElement)(root);

        const itemByKey = accounting.get(view) || new Map<string, ItemElement>();
        accounting.set(view, itemByKey);
        let lastElement: Element | null = null;
        for (const v of transformModel(model)) {
            const key = (keyGetter as (v: V) => string)(v);
            const value = (valueGetter as (v: V ) => V)(v);
            let element: ItemElement | null = lastElement?.nextElementSibling as ItemElement;
            if (!element || element.getAttribute(keyAttribute) !== key)
                element = itemByKey.get(key) || null;

            if (!element) {
                element = view.querySelector(`${itemTagName || "*"}[${keyAttribute}="${key}"]`);

                if (!element) {
                    element = (createItem as CreateItemFunc<ItemElement>)(root.ownerDocument);
                    element.setAttribute(keyAttribute, key);
                    view.append(element);
                }

                itemByKey.set(key, element);
            }

            if (element.previousElementSibling !== lastElement) {
                if (lastElement)
                    lastElement.after(element);
                else
                    view.prepend(element);
            }

            updateItem(element, value, key);
            lastElement = element;
        }

        const first = () => lastElement ? lastElement.nextElementSibling : view.firstElementChild;

        for (let toDelete = first(); toDelete; toDelete = first()) {
            itemByKey.delete(toDelete.getAttribute(keyAttribute)!);
            toDelete.remove();
        }

    }
}