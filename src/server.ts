import {H0Spec} from "./h0";
import {DOMParser} from "linkedom";
import Express from "express";
import {resolve} from "path";
import { build, buildSync } from "esbuild";
import {rmSync, writeFileSync, readFileSync, existsSync} from "fs";
import os from "os"
import {randomUUID} from "crypto";

export function h0router(folder: string) {
    const index = resolve(folder, "index.h0.ts");

    if (!existsSync(index))
        return null;

    const {scope, route, render, selectRoot, template} = require(index) as H0Spec;
    const expressRouter = Express.Router();
    expressRouter.use(scope, Express.static(folder, {fallthrough: true}));
    expressRouter.use(async (req: Express.Request, res: Express.Response, next: () => void) => {
        if (!req.path.startsWith(scope)) {
            next();
            return;
        }

        console.log(req.path);

        if (req.path.endsWith("h0.bundle.js")) {
            const tmp = `${os.tmpdir}/${randomUUID()}.ts`;
            writeFileSync(tmp, `
                import {H0Client} from "${resolve(__dirname, "client.ts")}";
                import * as spec from "${index}";
                export const h0client = new H0Client(spec);
            `);
            const {outputFiles} = buildSync({
                entryPoints: [tmp], bundle: true, sourcemap: "inline", format: "esm", target: "es2020", write: false,
            define: {RUNTIME: "\"window\""}});
            rmSync(tmp);
            res.setHeader("Content-Type", "application/javascript");
            res.send(outputFiles[0].text);
            return;
        }

        const html = readFileSync(resolve(folder, template), "utf-8");
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
        if (!response || !render) {
            res.send(html);
            return;
        }

        const document = new DOMParser().parseFromString(html, "text/html");
        const rootElement = selectRoot(document);
        globalThis.RUNTIME = "node";
        await render(response, rootElement as HTMLElement);
        res.send(document.toString());
    });

    return expressRouter;
}
