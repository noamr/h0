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
      function fetchWithManualRedirects(req) {
        fetch(req, {redirect: "manual"})
      }
      initClient({scope, selectRoot, mount, fetchModel : ${fetchModelOnClient ? "fetchModel" : "fetchWithManualRedirects"}, renderView});
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

export function buildVercelMiddleware(folder: string, outFile: string,{serverSideRendering, stream, buildOptions}: {serverSideRendering: boolean, stream: boolean, buildOptions?: BuildOptions}) {
  const indexModule = resolve(folder, "index.h0.ts");
  const spec = require(indexModule) as H0Spec;
  const template = readFileSync(resolve(folder, "template.h0.html"), "utf-8");
  const templateWithIncludes = resolveIncludes(template, folder);
  const tmp = `${tmpdir()}/h0-${randomUUID()}.ts`;
  serverSideRendering = serverSideRendering && spec.fetchModel.runtime !== "client-only";
  writeFileSync(tmp, `
      import {createServeFunction} from "${resolve(__dirname, "serve.ts")}";
      import {next} from "@vercel/edge";
      import * as spec from "${indexModule}";

      const templateHTML = decodeURIComponent("${encodeURIComponent(templateWithIncludes)}");
      const serve = createServeFunction(spec, templateHTML, {serverSideRendering: ${serverSideRendering}, steam: ${stream}});
      export default async function h0_middleware(req) {
        const response = await serve(req);
        return response || next();
      }
  `);


  const result = buildSync({
      bundle: true,
      sourcemap: "inline",
      format: "esm",
      target: "node18",
      external: ["@vercel/edge"],
      define: {RUNTIME: "\"node\""},
      outfile: resolve(outFile),
      entryPoints: [tmp],
      ...buildOptions});
  rmSync(tmp);
}