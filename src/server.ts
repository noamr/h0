import {H0Spec} from "./h0";
import {DOMParser} from "linkedom";
import Express from "express";
import {resolve} from "path";
import { build, buildSync } from "esbuild";
import {rmSync, writeFileSync, readFileSync, existsSync} from "fs";
import os from "os"
import {randomUUID} from "crypto";

interface ServerConfig {
    templateHTML: string
    indexModule: string
    publicFolder?: string
    options?: ServerOptions
}

export interface ServerOptions {
    serverSideRendering: boolean;
}

export function routerFromFolder(folder: string, options?: ServerOptions) {
    const indexModule = resolve(folder, "index.h0.ts");
    const publicFolder = resolve(folder, "public");
    const htmlFile = resolve(folder, "template.h0.html");
    if (!existsSync(htmlFile)) {
        console.error(`Template ${htmlFile} not found`);
        return null;
    }
    const templateHTML = readFileSync(htmlFile, "utf-8");
    return router({templateHTML, indexModule, publicFolder, options});
}

export function router({templateHTML, indexModule, publicFolder, options}: ServerConfig) {
    if (!existsSync(indexModule)) {
        console.error(`Module ${indexModule} not found`);
        return null;
    }

    const serverSideRendering = !!(options?.serverSideRendering);

    const {scope, route, render, selectRoot} = require(indexModule) as H0Spec;
    const expressRouter = Express.Router();
    if (publicFolder && existsSync(publicFolder))
        expressRouter.use(scope, Express.static(publicFolder, {fallthrough: true}));

    expressRouter.use(async (req: Express.Request, res: Express.Response, next: () => void) => {
        if (!req.path.startsWith(scope)) {
            next();
            return;
        }

        if (req.path.endsWith("h0.bundle.js")) {
            const tmp = `${os.tmpdir}/${randomUUID()}.ts`;
            writeFileSync(tmp, `
                import {initClient} from "${resolve(__dirname, "client.ts")}";
                import * as spec from "${indexModule}";
                initClient(spec);
            `);
            const {outputFiles} = buildSync({
                entryPoints: [tmp], bundle: true, sourcemap: "inline", format: "esm", target: "chrome108", write: false,
            define: {RUNTIME: "\"window\""}});
            rmSync(tmp);
            res.setHeader("Content-Type", "application/javascript");
            res.send(outputFiles[0].text);
            return;
        }

        const mode = req.headers["sec-fetch-mode"];
        const fetchRequest = new Request(new URL(req.url, "http://" + req.headers.host), {method: req.method, body: req.body});
        const response = await route?.(fetchRequest);
        if (response) {
            for (const [h, v] of response.headers.entries())
                res.setHeader(h, v);
        }

        if (mode !== "navigate") {
            if (response)
                res.send(await response.text());
            else
                next();
            return;
        }

        res.setHeader("Content-Type", "text/html");
        if (!response || !render || !serverSideRendering) {
            res.send(templateHTML);
            return;
        }

        const document = new DOMParser().parseFromString(templateHTML, "text/html");
        const rootElement = selectRoot(document);
        globalThis.RUNTIME = "node";
        await render(response, rootElement as HTMLElement);
        res.send(document.toString());
    });

    return expressRouter;
}
