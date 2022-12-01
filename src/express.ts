import {H0Spec} from "./h0";
import Express from "express";
import {resolve, dirname} from "path";
import { BuildOptions } from "esbuild";
import {readFileSync, existsSync, mkdirSync} from "fs";
import { buildClientBundle, resolveIncludes } from "./build";
import { createServeFunction } from "./serve";
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

    const templateHTML = readFileSync(htmlFile, "utf-8");
    return router({templateHTML, indexModule, publicFolders, options});
}

export function router({templateHTML, indexModule, publicFolders, options}: ServerConfig) {
    if (!existsSync(indexModule))
        throw new Error(`Module ${indexModule} not found`);''

    const serverSideRendering = !!(options?.serverSideRendering);
    const spec = require(indexModule) as H0Spec;

    const scope = spec.scope || "/";

    const serve = createServeFunction(spec, resolveIncludes(templateHTML, dirname(indexModule)), {serverSideRendering});

    const expressRouter = Express.Router();
    for (const publicFolder of publicFolders.filter(existsSync))
        expressRouter.use(scope, Express.static(publicFolder, {fallthrough: true}));

    const tmpdir = `${os.tmpdir}/h0-${randomUUID()}`;
    mkdirSync(tmpdir);
    buildClientBundle(indexModule, tmpdir, options?.esbuild);

    expressRouter.use(resolve(scope, ".h0"), Express.static(tmpdir, {fallthrough: true}));

    expressRouter.use(async (req: Express.Request, res: Express.Response, next: () => void) => {
        const headers = new Headers;
        for (const header in req.headers)
            headers.set(header, req.headers[header] as string);
        const fetchRequest = new Request(new URL(req.url, `${req.protocol}://${req.headers.host}`), {method: req.method, body: req.body, headers});
        const url = new URL(fetchRequest.url);
        if (!url.pathname.startsWith(scope)) {
            next();
            return;
        }

        const response = await serve(fetchRequest);
        if (!response) {
            next();
            return;
        }

        if (response.status === 200)
            res.send(await response.text());
        else {
            res.sendStatus(response.status);
            for (const [header, value] of response.headers)
                res.setHeader(header, value);
        }
    });

    return expressRouter;
}
