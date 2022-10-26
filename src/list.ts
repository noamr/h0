import * as LinkeDom from "linkedom";
type UpdateItemFunc<V> = (element: Element, value: V, key: string, index: number) => void;
type CreateItemFunc = (document: globalThis.Document) => globalThis.Element;

interface Model<ValueType, EntryType = ValueType> {
    entries: Iterable<EntryType>;
    getKey: (entry: EntryType, index: number) => string;
    getValue: (entry: EntryType) => ValueType;
}

interface View<ValueType> {
    container: globalThis.Element | LinkeDom.HTMLElement,
    createItem: CreateItemFunc,
    updateItem: UpdateItemFunc<ValueType>,
    keyAttribute: string
}

interface ModelMapper<ValueType, EntryType = ValueType> {
    model: Model<ValueType, EntryType>;
    view: View<ValueType>;
};

const accounting = new WeakMap<Element | LinkeDom.HTMLElement, Map<string, Element>>();

export function mapModelToListView<V, E = V>({view, model}: ModelMapper<V, E>) {
    const {entries, getKey, getValue} = model;
    const {container, createItem, updateItem, keyAttribute} = view;
    const itemByKey = accounting.get(container) || new Map<string, Element>();
    const document = container.ownerDocument;
    accounting.set(container, itemByKey);
    let lastElement: Element | null = null;
    Array.from(entries).forEach((e, i) => {
        const key = getKey(e, i);
        const value = getValue(e);
        let element: Element | LinkeDom.HTMLElement | null = lastElement?.nextElementSibling!;
        if (!element || element.getAttribute(keyAttribute) !== key)
            element = itemByKey.get(key) || null;

        if (!element) {
            element = container.querySelector(`*[${keyAttribute}="${key}"]`) as HTMLElement;

            if (!element) {
                element = createItem(document);
                element.setAttribute(keyAttribute, key);
                container.append(element);
            }

            itemByKey.set(key, element);
        }

        if (element.previousElementSibling !== lastElement) {
            if (lastElement)
                lastElement.after(element as Element);
            else
                container.prepend(element as Element);
        }

        updateItem(element, value, key, i);
        lastElement = element;
    });

    const first = () => lastElement ? lastElement.nextElementSibling : container.firstElementChild;

    for (let toDelete = first(); toDelete; toDelete = first()) {
        itemByKey.delete(toDelete.getAttribute(keyAttribute)!);
        toDelete.remove();
    }
}

export function objectModel<V>(object: {[key: string]: V}): Model<V, [string, V]> {
    return {
        getKey: e => e[0],
        getValue: e => e[1],
        entries: Object.entries(object)
    }
}

export function arrayModel<V>(array: V[], key: keyof V): Model<V> {
    return {
        getKey: e => String(e[key]),
        getValue: e => e,
        entries: array
    }
}

export function selectView(container: Element) : View<any> {
    return {
        container,
        createItem: (document) => document.createElement("option"),
        keyAttribute: "value",
        updateItem: (element: Element, value: string) => { element.innerHTML = "" + value; }
    };
}


export function templateView<V>({container, template, keyAttribute, updateItem}:
        {container: Element, template: Element, keyAttribute?: string, updateItem: UpdateItemFunc<V>}) : View<V> {
    return {
        container,
        createItem: (document) => {
            if (RUNTIME === "node") {
                const frag = document.createElement("div");
                frag.innerHTML = template.innerHTML;
                const root = frag.firstElementChild!;
                return root;
            }

            if (RUNTIME === "window")
                return (template as HTMLTemplateElement).content.firstElementChild?.cloneNode(true) as Element;

            throw new Error("unknown runtime");
        },
        keyAttribute: keyAttribute || "data-id",
        updateItem
    };
}