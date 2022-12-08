import { BehaviorArgs } from "./behaviors";
import { H0Navigator, H0Spec, HistoryMode } from "./h0";
import { captureLinks, captureSubmits, captureHistoryTraversal } from "./behaviors";
export function initClient(spec: H0Spec, context: Window = window) {
    const scope = spec.scope || "/";
    const { renderView, mount, fetchModel, selectRoot } = spec;
    const rootElement = selectRoot?.(document) || document.documentElement;
    if (!rootElement)
        throw new Error(`Root element not found`);

    const h0 = new class H0NavigatorImpl extends EventTarget implements H0Navigator {
        navigate(info: RequestInfo, historyMode: HistoryMode) {
            const req = info instanceof Request ? info : new Request(info);
            const { pathname } = new URL(req.url);
            if (!pathname.startsWith(scope))
                return false;

            fetchModel(req).then(response => respond(req.url, response, historyMode));
            return true;
        }
        reload() { return this.navigate(scope, "transparent"); }
        submitForm(form: HTMLFormElement, submitter?: HTMLElement | null) {
            const body: FormData | null = new FormData(form);
            const method = (submitter?.getAttribute("formmethod") || form.method || "GET").toUpperCase();
            const action = submitter?.getAttribute("formaction") || form.action;
            if (submitter && submitter.hasAttribute("name") && submitter.hasAttribute("value"))
                body.set(submitter.getAttribute("name")!, submitter.getAttribute("value")!);

            const historyMode = action === location.href ? "replace" : "push";
            if (method === "POST")
                return h0.navigate(new Request(action, { body, method }), historyMode);

            const url = new URL(action);
            for (const [k, v] of body)
                url.searchParams.append(k, v.toString());
            return h0.navigate(url.href, historyMode);
        }
    };

    async function respond(url: string, response: Response | null, historyMode: HistoryMode) {
        if (!response || response.type === "opaqueredirect") {
            location.href = url;
            return;
        }

        switch (response.status) {
            case 200:
                await renderView(response, selectRoot(context.document) as HTMLElement);
                switch (historyMode) {
                    case "push":
                        context.history.pushState(null, "", url);
                        break;
                    case "replace":
                        context.history.replaceState(null, "", url);
                        break;
                }
                h0.dispatchEvent(new Event("navigate"));
                break;
            case 201:
                h0.navigate(location.href, "transparent");
                break;
            case 302:
                h0.navigate(response.headers.get("Location")!, "replace");
                break;
            default:
                break;
        }
    }

    h0.navigate(location.pathname.startsWith(scope) ? location.href : scope, "replace");

    const behaviorArgs: BehaviorArgs = {h0, rootElement: rootElement as HTMLElement};
    const defaultBehaviors = [captureLinks, captureSubmits, captureHistoryTraversal];
    for (const initBehavior of defaultBehaviors)
        initBehavior(behaviorArgs);
    mount?.(rootElement as HTMLElement, { window: context, h0 });
    h0.dispatchEvent(new Event("navigate"));
}
