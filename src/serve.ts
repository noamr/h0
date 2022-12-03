import { H0Spec } from "./h0";
import { DOMParser } from "linkedom";
export function createServeFunction(spec: H0Spec, templateHTML: string, {serverSideRendering, stream}: {serverSideRendering: boolean, stream: boolean}) {
  return async function serve(req: Request): Promise<Response | null> {
      const {fetchModel, renderView, paths} = spec;
      const url = new URL(req.url);
      if (paths && !paths.includes(url.pathname))
        return null;

      globalThis.RUNTIME = "node";
      const responsePromise = fetchModel(req);
      let response = null as Response | null;

      stream = stream && !!paths;

      if (!stream) {
        response = await responsePromise;
        if (!response)
          return null;
      }

      const accept = req.headers.get("accept") || "*/*";

      if (!accept.includes("text/html"))
        return await responsePromise;

      const htmlHeaderParams = {headers: {"Content-Type": "text/html; charset=utf-8"}};

      if (!renderView || !serverSideRendering || fetchModel.runtime === "client-only")
          return new Response(templateHTML, htmlHeaderParams);

      const encoder = new TextEncoder();
      let streamController : ReadableStreamController<Uint8Array> | null = null;

      const readable = new ReadableStream({
        start(controller) {
          streamController = controller;
          if (stream)
            streamController.enqueue(new Uint8Array());
        },
      });

      const document = new DOMParser().parseFromString(templateHTML, "text/html");
      const rootElement = spec.selectRoot?.(document as any as Document) || document.documentElement;
      responsePromise.then(async resp => {
        await renderView(resp!, rootElement as HTMLElement);
        streamController?.enqueue(encoder.encode(document.toString()));
        streamController?.close();
      });
      const finalResponse = new Response(readable, htmlHeaderParams);
      for (const link of document.querySelectorAll("link[rel=preload]"))
        finalResponse.headers.append("Link", `<${link.getAttribute("href")}>;as="${link.getAttribute("as")}";rel="preload"`);
      for (const link of document.querySelectorAll("link[rel=preconnect]"))
        finalResponse.headers.append("Link", `<${link.getAttribute("href")}>;rel="preconnect"`);

      return finalResponse;
  }
}
