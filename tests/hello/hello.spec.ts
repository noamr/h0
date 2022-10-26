import { test, expect } from '@playwright/test';
import {serveFolder} from "../helper";

test('hello world', async ({ page }) => {
    const port = await serveFolder(__dirname);

    await page.goto(`http://localhost:${port}/hello/`);
    expect(await page.evaluate("document.querySelector('#text').innerHTML")).toEqual("Text from model");
    expect(await page.evaluate("document.querySelector('#list').firstElementChild.outerHTML")).toEqual("<li data-key=\"a\">A</li>");
    expect(await page.evaluate("document.querySelector('.mount').innerHTML")).toEqual("Text");
});
