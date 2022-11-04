import {test, expect} from '@playwright/test';
import {serveFolder} from "./helper";
import {resolve} from "path";

test('TODO mvc', async ({ page }) => {
    const {close, port} = await serveFolder(resolve(__dirname, "../examples/todo-mvc"), {additionalPublicFolders: [".."]});
    await page.goto(`http://localhost:${port}/todos/`);
    await page.evaluate("localStorage.removeItem('todos')");
    await page.reload();
    const newTaskTitle = (await page.$("form[name=newTask] input[name=title]"))!;
    await newTaskTitle.fill("New Task 1");
    await newTaskTitle.press("Enter");
    const list = await page.$(".todo-list")!;
    const children = await list?.$$("li");
    expect(children?.length).toEqual(1);
    const firstTitle =(await children?.[0].$("input[name=title]"))!;
    expect(await firstTitle.inputValue()).toEqual("New Task 1");
    await firstTitle.dblclick();
    expect(await firstTitle.evaluate(e => (e as HTMLInputElement).readOnly)).toBeFalsy();
    await firstTitle.fill("Edited 1");
    await firstTitle.press("Enter");
    expect(await firstTitle.evaluate(e => (e as HTMLInputElement).readOnly)).toBeTruthy();
    const children2 = await list?.$$("li");
    expect(children2?.length).toEqual(1);
    await close();
});
