import {H0Spec} from "./h0";
import {build} from "esbuild";
import {readFileSync} from "fs";
import { DOMParser} from "linkedom";
import {dirname, resolve} from "path";
import { Application } from "express";
import {rmSync, writeFileSync} from "fs";
import {tmpdir} from "os";
import {randomUUID} from "crypto";

export async function h0serve(app: Application, h0template: string) {
    const dir = dirname(h0template);
    const htmlMaster = readFileSync(h0template, "utf-8");
    const documentMaster = new DOMParser().parseFromString(htmlMaster, "text/html");
    for (const e of documentMaster.querySelectorAll("script[h0-runtime=standalone]"))
        e.remove();

    const h0link = documentMaster.querySelector('link[rel=h0]');
    if (!h0link)
        return;

    const specFilename = resolve(dir, h0link.getAttribute("href")!);
    const {route, render, options, scope, selectRoot} = (await import(specFilename)) as H0Spec;

    app.route(scope).all(async (req, res, next) => {
        const mode = req.headers["sec-fetch-mode"];
        console.log({mode});
        const fetchRequest = new Request(new URL(req.url, "http://" + req.headers.host), {method: req.method, body: req.body});
        const responsePromise = route(fetchRequest);
        if (!responsePromise) {
            next();
            return;
        }

        const response = await responsePromise;
        if (!response) {
            res.sendStatus(404);
            return;
        }
        for (const [h, v] of response.headers.entries())
            res.setHeader(h, v);

        if (mode === "navigate") {
            res.setHeader("Content-Type", "text/html");
            const temp = resolve(tmpdir(), `${randomUUID()}.js`);
            writeFileSync(temp,  `
                import * as spec from "${specFilename}";
                import {initClient} from "${resolve(__dirname, 'h0.ts')}";
                initClient(spec, window);
            `);

            const {outputFiles} = await build({
                entryPoints: [temp],
                define: {RUNTIME: "\"window\""},
                bundle: true, format: "esm", write: false, target: "es2020", sourcemap: "inline"});
            console.log(outputFiles[0].text);
            rmSync(temp);
            const document = new DOMParser().parseFromString(documentMaster.toString(), "text/html")!;
            const initScript = document.createElement("script");
            initScript.setAttribute("type", "module");
                initScript.innerHTML = outputFiles[0].text;
            document.appendChild(initScript);
            if (options.firstPass === "server") {
                const rootElement = selectRoot(document as any as Document);
                await render(response, rootElement as any as HTMLElement);
            }
            res.send(document.toString());
        } else
            res.send(await response.text());


    });
}
