import {randomUUID} from "crypto";
import {tmpdir} from "os";
import {writeFileSync, rmSync, readFileSync} from "fs";
import {H0Spec} from "./h0";
import {resolve} from "path";
import { BuildOptions, buildSync } from "esbuild";
import {DOMParser} from "linkedom";

export function buildClientBundle(indexModule: string, outDir: string, buildOptions: BuildOptions = {}) {
  const spec = require(indexModule) as H0Spec;
  const {fetchModel} = spec;
  const tmp = `${tmpdir()}/h0-${randomUUID()}.ts`;
  const fetchModelOnClient = fetchModel.runtime !== "server-only";
  writeFileSync(tmp, `
      import {initClient} from "${resolve(__dirname, "client.ts")}";
      import {renderView, scope, mount, selectRoot${fetchModelOnClient ? ", fetchModel" : ""}} from "${indexModule}";
      initClient({scope, selectRoot, mount, fetchModel : ${fetchModelOnClient ? "fetchModel" : "fetch"}, renderView});
  `);

  buildSync({
      bundle: true,
      sourcemap: "linked",
      format: "esm",
      target: "chrome108",
      outfile: resolve(outDir, "client.js"),
      define: {RUNTIME: "\"window\""},
      entryPoints: [tmp],
      ...buildOptions});
  rmSync(tmp);
}

export function resolveIncludes(templateHTML: string, templateRoot: string) {
  const document = new DOMParser().parseFromString(templateHTML, "text/html");
  for (const includeElement of document.querySelectorAll("h0-include[src]")) {
      const includePath = resolve(templateRoot, "public", "./" + includeElement.getAttribute("src")!);
      includeElement.outerHTML = readFileSync(includePath, "utf-8");
  }
  return document.toString();
}

export function createServeFunction(spec: H0Spec, templateHTML: string, {serverSideRendering}: {serverSideRendering: boolean}) {
  return async function serve(req: Request): Promise<Response> {
      const {fetchModel, renderView} = spec;
      const accept = req.headers.get("accept") || "*/*";
      globalThis.RUNTIME = "node";
      const response = await fetchModel(req);

      if (!response)
          return new Response("Could not fetch model", {status: 500});

      if (!accept.includes("text/html"))
          return response;

      if (!response || !renderView || !serverSideRendering || fetchModel.runtime === "client-only")
          return new Response(templateHTML);

      const document = new DOMParser().parseFromString(templateHTML, "text/html");
      const rootElement = spec.selectRoot?.(document as any as Document) || document.documentElement;
      await renderView(response, rootElement as HTMLElement);
      return new Response(document.toString());
  }
}


export function buildServerBundle(folder: string, outDir: string,{serverSideRendering, buildOptions}: {serverSideRendering: boolean, buildOptions?: BuildOptions}) {
  const indexModule = resolve(folder, "index.h0.ts");
  const spec = require(indexModule) as H0Spec;
  const template = readFileSync(resolve(folder, "template.h0.html"), "utf-8");
  const templateWithIncludes = resolveIncludes(template, folder);
  const tmp = `${tmpdir()}/h0-${randomUUID()}.ts`;
  serverSideRendering = serverSideRendering && spec.fetchModel.runtime !== "client-only";
  writeFileSync(tmp, `
      import {createServeFunctiom} from "${__filename}";
      import * as spec from "${indexModule}";

      const templateHTML = decodeURIComponent("${encodeURIComponent(templateWithIncludes)}");
      export const serve = createServeFunction(spec, templateHTML, {serverSideRendering: ${serverSideRendering}});
  `);


  buildSync({
      bundle: true,
      sourcemap: "inline",
      format: "esm",
      target: "node18",
      outfile: resolve(outDir, "index.js"),
      define: {RUNTIME: "\"node\""},
      entryPoints: [tmp],
      ...buildOptions});
  rmSync(tmp);

}