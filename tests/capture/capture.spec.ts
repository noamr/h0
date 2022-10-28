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
        await close();
    });
});
