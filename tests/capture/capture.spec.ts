import {test, expect} from '@playwright/test';
import {serveFolder} from "../helper";

test.describe('capture tests', () => {
    test('Submit events are captured', async ({ page }) => {
        const {close, port} = await serveFolder(__dirname);
        await page.goto(`http://localhost:${port}/capture/`);

        const sub1 = await page.$('input[name="sub1"]');
        await sub1?.click();
        expect(await page.evaluate("document.querySelector('output#method').innerHTML")).toEqual("POST");
        expect(await page.evaluate("document.querySelector('output#path').innerHTML")).toEqual("/capture/");
        expect(await page.evaluate("document.querySelector('output#renders').innerHTML")).toEqual("2");

        const sub2 = await page.$('input[name="sub2"]');
        await sub2?.click();
        expect(await page.evaluate("document.querySelector('output#method').innerHTML")).toEqual("GET");
        expect(await page.evaluate("document.querySelector('output#path').innerHTML")).toEqual("/capture/");
        expect(await page.evaluate("document.querySelector('output#renders').innerHTML")).toEqual("3");

        const sub3 = await page.$('input[name="sub3"]');
        await sub3?.click();
        expect(await page.evaluate("document.querySelector('output#method').innerHTML")).toEqual("POST");
        expect(await page.evaluate("document.querySelector('output#path').innerHTML")).toEqual("/capture/button");
        expect(await page.evaluate("document.querySelector('output#renders').innerHTML")).toEqual("4");

        const internalLink = await page.$("a#internal");
        await internalLink?.click();
        expect(await page.evaluate("document.querySelector('output#method').innerHTML")).toEqual("GET");
        expect(await page.evaluate("document.querySelector('output#path').innerHTML")).toEqual("/capture/internal");
        expect(await page.evaluate("location.href")).toMatch("/capture/internal");
        expect(await page.evaluate("document.querySelector('output#renders').innerHTML")).toEqual("5");

        const externalLink = await page.$("a#external");
        await externalLink?.click();
        expect(await page.title()).toEqual("Error");

        await close();
    });
});
