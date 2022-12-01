import { H0Spec } from "./h0";
import { DOMParser } from "linkedom";
export function createServeFunction(spec: H0Spec, templateHTML: string, {serverSideRendering}: {serverSideRendering: boolean}) {
  return async function serve(req: Request): Promise<Response | null> {
      const {fetchModel, renderView} = spec;
      const accept = req.headers.get("accept") || "*/*";
      globalThis.RUNTIME = "node";
      const response = await fetchModel(req);

      if (!response)
          return null;

      if (!accept.includes("text/html"))
          return response;

      const htmlHeaderParams = {headers: {"Content-Type": "text/html"}};

      if (!response || !renderView || !serverSideRendering || fetchModel.runtime === "client-only")
          return new Response(templateHTML, htmlHeaderParams);

      const document = new DOMParser().parseFromString(templateHTML, "text/html");
      const rootElement = spec.selectRoot?.(document as any as Document) || document.documentElement;
      await renderView(response, rootElement as HTMLElement);
      return new Response(document.toString(), htmlHeaderParams);
  }
}
