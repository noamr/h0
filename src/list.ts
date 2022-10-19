const listAcounting = new WeakMap<Element, Map<string, Element>>();
type UpdateItemFunc<V, ItemElement extends Element = Element> = (element: ItemElement, value: V, key: string) => void;
type CreateItemFunc<ItemElement extends Element = Element> = (document: Document) => ItemElement;

type ModelSchema<V> = "object" | "array" | "entries" | ((v : V, i: number) => string) | ((e: [string, V], i: number) => string);
interface ListUpdaterParams<V, ItemElement extends Element = Element, ListElement extends Element = Element, Schema extends ModelSchema<V> = any> {
    modelSchema?: Schema;
    keyAttribute: string;
    createItem?: HTMLTemplateElement | CreateItemFunc<ItemElement>;
    itemTagName?: string;
    updateItem: UpdateItemFunc<V, ItemElement>;
}

export function createListUpdater<V, ItemElement extends Element = Element, ListElement extends Element = Element, Schema extends ModelSchema<V> = any>(params: ListUpdaterParams<V, ItemElement, ListElement, ModelSchema<V>>) {
    let {createItem, itemTagName, modelSchema, updateItem, keyAttribute} = params;

    if (!createItem) {
        if (itemTagName)
            createItem = (document: Document) => document.createElement(itemTagName!) as Element as ItemElement;
        else
            throw new TypeError("createItem or itemTagName required");
    }

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
    type ModelType = "array" extends Schema ? V[] :
                     "object" extends Schema ? {[key: string]: V} :
                     "entries" extends Schema ? Array<[string, V]> :
                     V;

    return (view: ListElement, model: ModelType) => {
        const itemByKey = accounting.get(view) || new Map<string, ItemElement>();
        accounting.set(view, itemByKey);
        let lastElement: Element | null = null;
        transformModel(model).forEach((v: V, i: number) => {
            const key = (keyGetter as (v: V, i: number) => string)(v, i);
            const value = (valueGetter as (v: V ) => V)(v);
            let element: ItemElement | null = lastElement?.nextElementSibling as ItemElement;
            if (!element || element.getAttribute(keyAttribute) !== key)
                element = itemByKey.get(key) || null;

            if (!element) {
                element = view.querySelector(`${itemTagName || "*"}[${keyAttribute}="${key}"]`);

                if (!element) {
                    element = (createItem as CreateItemFunc<ItemElement>)(view.ownerDocument);
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
        });

        const first = () => lastElement ? lastElement.nextElementSibling : view.firstElementChild;

        for (let toDelete = first(); toDelete; toDelete = first()) {
            itemByKey.delete(toDelete.getAttribute(keyAttribute)!);
            toDelete.remove();
        }
    }
}