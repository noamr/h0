import { createListUpdater } from "../src/list";
import {DOMParser} from "linkedom";

function emptyDoc() {
    return new DOMParser().parseFromString("<html><body><ul></ul></html>", "text/html")    
}

test("list updater with object schema", () => {
    const doc = emptyDoc();
    const updater = createListUpdater<number, HTMLLIElement, HTMLUListElement, "object">({
        modelSchema: "object",
        keyAttribute: "id",
        itemTagName: "li",
        updateItem: (li: HTMLLIElement, value: number, key: string) => li.innerHTML = `${key}: ${value};`
    });
    updater(doc.querySelector("ul") as any as HTMLUListElement, {a: 123, b: 456});
    expect(doc.querySelector("ul").outerHTML).toEqual(`<ul><li id="a">a: 123;</li><li id="b">b: 456;</li></ul>`);
});

test("list updater with array schema", () => {
    const doc = emptyDoc();
    const updater = createListUpdater<number, HTMLLIElement, HTMLUListElement, "array">({
        modelSchema: "array",
        keyAttribute: "id",
        itemTagName: "li",
        updateItem: (li: HTMLLIElement, value: number, key: string) => li.innerHTML = `${key}: ${value};`
    });
    updater(doc.querySelector("ul") as any as HTMLUListElement, [123, 456]);
    expect(doc.querySelector("ul").outerHTML).toEqual(`<ul><li id="0">0: 123;</li><li id="1">1: 456;</li></ul>`);
});


test("list updater with entries schema", () => {
    const doc = emptyDoc();
    const updater = createListUpdater<number, HTMLLIElement, HTMLUListElement, "entries">({
        modelSchema: "entries",
        keyAttribute: "id",
        itemTagName: "li",
        updateItem: (li: HTMLLIElement, value: number, key: string) => li.innerHTML = `${key}: ${value};`
    });
    updater(doc.querySelector("ul") as any as HTMLUListElement, [["a", 123], ["b", 456]]);
    expect(doc.querySelector("ul").outerHTML).toEqual(`<ul><li id="a">a: 123;</li><li id="b">b: 456;</li></ul>`);
});