import {test, expect} from '@playwright/test';
import {serveFolder} from "../helper";
import {Application} from "express";

test.describe('hello tests', () => {
    test('No rendering', async ({ page }) => {
        const {close, port} = await serveFolder(__dirname);
        await page.goto(`http://localhost:${port}/hello/`);

        // Model is applied
        expect(await page.evaluate("document.querySelector('#text').innerHTML")).toEqual("Default");

        // List is mapped
        expect(await page.evaluate("document.querySelector('#list').firstElementChild")).toEqual(null);

        // Mount occurs, public folder is respected
        expect(await page.evaluate("document.querySelector('.mount').innerHTML")).toEqual("");
        await close();
    });

    test('Basic client-side rendering', async ({ page }) => {
        const {close, port} = await serveFolder(__dirname);
        await page.goto(`http://localhost:${port}/hello/`);

        // Load the client side bundle
        await page.evaluate("import ('/hello/h0.bundle.js')");
        // Model is applied
        expect(await page.evaluate("document.querySelector('#text').innerHTML")).toEqual("Text from model");

        // List is mapped
        expect(await page.evaluate("document.querySelector('#list').firstElementChild.outerHTML")).toEqual("<li data-key=\"a\">A</li>");

        // Mount occurs, public folder is respected
        expect(await page.evaluate("document.querySelector('.mount').innerHTML")).toEqual("Post-mount text from public folder");

        // render runtime is window
        expect(await page.evaluate("document.querySelector('.runtime').innerHTML")).toEqual("client");
        await close();
    });


    test('Server-side + client side rendering', async ({ page }) => {
        const {close, port} = await serveFolder(__dirname, {serverSideRendering: true});
        await page.goto(`http://localhost:${port}/hello/`);

        // Load the client side bundle
        await page.evaluate("import ('/hello/h0.bundle.js')");
        // Model is applied
        expect(await page.evaluate("document.querySelector('#text').innerHTML")).toEqual("Text from model");

        // List is mapped
        expect(await page.evaluate("document.querySelector('#list').firstElementChild.outerHTML")).toEqual("<li data-key=\"a\">A</li>");

        // Mount occurs, public folder is respected
        expect(await page.evaluate("document.querySelector('.mount').innerHTML")).toEqual("Post-mount text from public folder");

        // render runtime is node
        expect(await page.evaluate("document.querySelector('.runtime').innerHTML")).toEqual("client");
        await close();
    });


    test('Server-side rendering without client side', async ({ page }) => {
        const {close, port} = await serveFolder(__dirname, {serverSideRendering: true});
        await page.goto(`http://localhost:${port}/hello/`);

        // Model is applied
        expect(await page.evaluate("document.querySelector('#text').innerHTML")).toEqual("Text from model");

        // List is mapped
        expect(await page.evaluate("document.querySelector('#list').firstElementChild.outerHTML")).toEqual("<li data-key=\"a\">A</li>");

        // Mount does not occur
        expect(await page.evaluate("document.querySelector('.mount').innerHTML")).toEqual("");

        // render runtime is node
        expect(await page.evaluate("document.querySelector('.runtime').innerHTML")).toEqual("node");
        await close();
    });
});
