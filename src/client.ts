declare global {
    var RUNTIME: "window" | "node";
}

import {H0Spec} from "./h0";

export type HistoryMode = "push" | "replace" | "transparent";

export interface Navigator {
    navigate(info: RequestInfo, historyMode: HistoryMode): boolean;
    submitForm(form: HTMLFormElement, submitter?: HTMLElement | null): boolean;
    reload(): void;
}

export class H0Client implements Navigator {
    #spec: H0Spec;
    #route:  Required<H0Spec>["route"] | Window["fetch"];
    #context: Window;

    constructor(spec: H0Spec, context: Window = window) {
        this.#spec = spec;
        this.#context = context;
        this.#route = this.#spec.route || ((r: RequestInfo) => fetch(r));
        const rootElement = spec.selectRoot(document);
        if (!rootElement)
            throw new Error(`Root element not found`);

        (rootElement as HTMLElement).addEventListener("submit", (e: SubmitEvent) => {
            if (this.submitForm(e.target as HTMLFormElement, e.submitter))
                e.preventDefault();
        }, {capture: true});

        (rootElement as HTMLElement).addEventListener("click", async (e: MouseEvent) => {
            if ((e.target instanceof HTMLAnchorElement) && this.navigate((e.target as HTMLAnchorElement).href, "push"))
                e.preventDefault();
        }, {capture: true});

        this.navigate(location.pathname.startsWith(spec.scope) ? location.href : spec.scope, "replace");
        console.log(RUNTIME);
        if (RUNTIME === "window")
            spec.mount?.(rootElement as HTMLElement, {window: context, h0: this});
    }

    navigate(info: RequestInfo, historyMode: HistoryMode) {
        const req = new Request(info);
        const {scope, selectRoot, render} = this.#spec;
        const {pathname} = new URL(req.url);
        if (!pathname.startsWith(scope))
            return false;

        this.#route(req).then(async (response: Response | null) => {
            if (!response) {
                location.href = req.url;
                return;
            }

            switch (response.status) {
            case 200:
                render(response, selectRoot(this.#context.document) as HTMLElement);
                switch (historyMode) {
                    case "push":
                        this.#context.history.pushState(null, "", req.url);
                        break;
                    case "replace":
                        this.#context.history.replaceState(null, "", req.url);
                        break;
                }
                break;

            case 302:
                this.navigate(response.headers.get("Location")!, "replace");
                break;
            }
        });
        return true;
    }

    submitForm(form: HTMLFormElement, submitter?: HTMLElement | null) {
        let body : FormData | null = new FormData(form);
        const method = (submitter?.getAttribute("formmethod") || form.method || "GET").toUpperCase();
        let action = submitter?.getAttribute("formaction") || form.action;
        const historyMode = action === location.href ? "replace" : "push";
        if (method === "POST")
            return this.navigate(new Request(action, {body, method}), historyMode);

        const url = new URL(action);
        for (const [k, v] of body)
            url.searchParams.append(k, v.toString());
        return this.navigate(url.href, historyMode);
    }

    reload() { this.navigate(this.#spec.scope, "transparent"); }
}
