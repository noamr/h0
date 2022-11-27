import {H0Spec} from "./h0";
import {DOMParser} from "linkedom";
import Express from "express";
import {resolve} from "path";
import { BuildOptions, buildSync } from "esbuild";
import {rmSync, writeFileSync, readFileSync, existsSync, mkdirSync, watchFile} from "fs";
import os from "os"
import {randomUUID} from "crypto";

interface ServerConfig {
    templateHTML: string
    indexModule: string
    publicFolders: string[]
    options?: ServerOptions
}

export interface ServerOptions {
    serverSideRendering: boolean;
    additionalPublicFolders: string[];
    esbuild: BuildOptions
    watch: boolean
}

export function routerFromFolder(folder: string, options?: ServerOptions) {
    const indexModule = resolve(folder, "index.h0.ts");
    const publicFolders = [...options?.additionalPublicFolders || [], resolve(folder, "public")];
    const htmlFile = resolve(folder, "template.h0.html");
    if (!existsSync(htmlFile))
       throw new Error(`Template ${htmlFile} not found`);

    const createRouter = () => {
        const templateHTML = readFileSync(htmlFile, "utf-8");
        return router({templateHTML, indexModule, publicFolders, options});
    };

    if (!options?.watch)
        return createRouter();

    let currentRouter = createRouter();
    const metaRouter = Express.Router();
    const resetRouter =  () => {
        currentRouter = createRouter();
    };
    metaRouter.use((...args) => currentRouter(...args));
    watchFile(htmlFile, resetRouter);
    watchFile(indexModule, resetRouter);
    return metaRouter;
}

export function router({templateHTML, indexModule, publicFolders, options}: ServerConfig) {
    if (!existsSync(indexModule))
        throw new Error(`Module ${indexModule} not found`);

    const serverSideRendering = !!(options?.serverSideRendering);
    const spec = require(indexModule) as H0Spec;

    const scope = spec.scope || "/";
    const selectRoot = spec.selectRoot || ((d: Document) => d.documentElement);

    const {route, render} = spec;
    const expressRouter = Express.Router();
    for (const publicFolder of publicFolders.filter(existsSync))
        expressRouter.use(scope, Express.static(publicFolder, {fallthrough: true}));

    const tmpdir = `${os.tmpdir}/h0-${randomUUID()}`;
    const tmp = `${os.tmpdir}/h0-${randomUUID()}.ts`;
    mkdirSync(tmpdir);
    writeFileSync(tmp, `
        import {initClient} from "${resolve(__dirname, "client.ts")}";
        import * as spec from "${indexModule}";
        initClient(spec);
    `);

    buildSync({
        entryPoints: [tmp], bundle: true, sourcemap: "linked", format: "esm", target: "chrome108", outfile: resolve(tmpdir, "client.js"),
        define: {RUNTIME: "\"window\""}, ...options?.esbuild});
    rmSync(tmp);

    expressRouter.use(resolve(scope, ".h0"), Express.static(tmpdir, {fallthrough: true}));

    expressRouter.use(async (req: Express.Request, res: Express.Response, next: () => void) => {
        if (!req.path.startsWith(scope)) {
            next();
            return;
        }

        const accept = req.headers["accept"];
        const fetchRequest = new Request(new URL(req.url, "http://" + req.headers.host), {method: req.method, body: req.body});
        globalThis.RUNTIME = "node";
        const response = await route?.(fetchRequest);
        if (response) {
            for (const [h, v] of response.headers.entries())
                res.setHeader(h, v);
        }

        if (!accept?.includes("text/html")) {
            if (response)
                res.send(await response.text());
            else
                next();
            return;
        }

        res.setHeader("Content-Type", "text/html");
        res.setHeader("Vary", "Accept, Accept-Encoding");
        if (!response || !render || !serverSideRendering) {
            res.send(templateHTML);
            return;
        }

        const document = new DOMParser().parseFromString(templateHTML, "text/html");
        for (const includeElement of document.querySelectorAll("h0-include[src]") as HTMLElement[]) {
            console.log(includeElement.getAttribute("src"), fetchRequest.url);
            const includeURL = new URL(includeElement.getAttribute("src")!, fetchRequest .url);
            const resp = await fetch(includeURL);
            includeElement.outerHTML = await resp.text();
        }

        const rootElement = selectRoot(document as any as Document);
        await render(response, rootElement as HTMLElement);
        res.send(document.toString());
    });

    return expressRouter;
}
