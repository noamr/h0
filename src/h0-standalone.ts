import { initClient } from "./h0";

window.addEventListener("DOMContentLoaded", async () => {
    const link = document.head.querySelector("link[rel=h0][href]") as HTMLLinkElement;
    if (!link)
        return;
    const {href} = link;
    const moduleHref = href.endsWith(".ts") ? `${href}?h0=bundle` : href;
    const spec = await import(moduleHref);
    const h0 = await initClient(spec, window);
    h0.navigate(spec.scope, "transparent");
});