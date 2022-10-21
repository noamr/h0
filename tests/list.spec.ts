import { arrayModel, mapModelToListView, objectModel } from "../src/list";
import {DOMParser} from "linkedom";
import { test, expect } from '@playwright/test';

function emptyDoc() {
    return new DOMParser().parseFromString("<html><body><ul></ul></html>", "text/html")    
}

test("list updater with object schema", () => {
    const doc = emptyDoc();
    mapModelToListView({
        view: {
            container: doc.querySelector("ul"),
            keyAttribute: "id",
            createItem: d => d.createElement("li"),
            updateItem: (li, value, key) => { li.innerHTML =  `${key}: ${value}`; }
        },
        model: objectModel( {a: 123, b: 456})
    });

    expect(doc.querySelector("ul").outerHTML).toEqual(`<ul><li id="a">a: 123</li><li id="b">b: 456</li></ul>`);
});

test("list updater with array schema", () => {
    const doc = emptyDoc();
    mapModelToListView({
        view: {
            container: doc.querySelector("ul"),
            updateItem: (li, value, key) => { li.innerHTML = `${key}: ${value}`; },
            createItem: d => d.createElement("li"),
            keyAttribute: "id"
        },
        model: {
            entries: [123, 456],
            getKey: (e, index) => String(index),
            getValue: e => e
        }
    });
    expect(doc.querySelector("ul").outerHTML).toEqual(`<ul><li id="0">0: 123</li><li id="1">1: 456</li></ul>`);
});