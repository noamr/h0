import {H0Spec, RenderFunction, RouteFunction} from "./h0";
import {build} from "esbuild";
import {readFileSync} from "fs";
import { DOMParser} from "linkedom";
import { randomUUID } from "crypto";
import {dirname, resolve} from "path";
import vm from "node:vm";
import e, { Application } from "express";

export async function h0serve(app: Application, h0template: string) {
    const dir = dirname(h0template);
    const htmlMaster = readFileSync(h0template, "utf-8");
    const documentMaster = new DOMParser().parseFromString(htmlMaster, "text/html");
    const h0spec = documentMaster.querySelector('script[type="application/json+h0"]');
    if (!h0spec)
        return;
    console.log(h0spec.textContent)
    const {router, renderer, rootSelector, scope, options} = JSON.parse(h0spec.textContent) as H0Spec;
    const routerURL = resolve(dir, router);
    const rendererURL = resolve(dir, renderer);
    const h0URL = resolve(__dirname, "h0.ts");
    const esbuild = async (filename: string) => (await build({entryPoints: [filename], write: false, bundle: true, format: "esm", target: "es2020"})).outputFiles[0].text;
    const route = (await import(routerURL)).route as RouteFunction;
    const render = (await import(rendererURL)).render as RenderFunction;
    const [rendererFile, routerFile, initFile] = await Promise.all([rendererURL, routerURL, h0URL].map(esbuild));
    h0spec.remove();

    const initScript = documentMaster.createElement("script");
    initScript.setAttribute("type", "module");
    initScript.textContent = `
        import {initClient} from "${scope}?h0=init";
        initClient({
            rootSelector: "${rootSelector}",
            scope: "${scope}",
            options: ${JSON.stringify(options || null)},
            renderer: "${scope}?h0=renderer",
            router: "${scope}?h0=router"
        }, window);
    `;
    documentMaster.body.appendChild(initScript as any);

    app.route(scope).all((req, res, next) => {
        if (req.query["h0"] === "renderer") {
            res.setHeader("Content-Type", "application/javascript");
            res.send(rendererFile);
            return;
        }
        if (req.query["h0"] === "init") {
            res.setHeader("Content-Type", "application/javascript");
            res.send(initFile);
            return;
        }
        if (req.query["h0"] === "router") {
            res.setHeader("Content-Type", "application/javascript");
            res.send(routerFile);
            return;
        }

        const mode = req.headers["sec-fetch-mode"];
        console.log(req.url, req.headers.host);
        const fetchRequest = new Request(new URL(req.url, "http://" + req.headers.host), {method: req.method, body: req.body});
        const responsePromise = route(fetchRequest);
        if (!responsePromise)
            next();

        console.log({options, mode});

        responsePromise.then(async (resp: Response | null) => {
            if (!resp) {
                res.sendStatus(404);
                return;
            }
            for (const [h, v] of resp.headers.entries())
                res.setHeader(h, v);
            if (mode === "navigate") {
                res.setHeader("Content-Type", "text/html");
                if (options?.firstPass === "server") {
                    const document = new DOMParser().parseFromString(documentMaster.toString(), "text/html")!;
                    console.log(documentMaster.toString(), rootSelector)
                    const rootElement = document.querySelector(rootSelector) || document.documentElement;
                    await render(resp, rootElement as any as HTMLElement);
                    res.send(document.toString());
                } else {
                    res.send(documentMaster.toString());
                }
            } else
                res.send(await resp.text());
        });


    });
}
