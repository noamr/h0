type Runtime = "window" | "node";
declare global {
    var RUNTIME: Runtime;
}

export type HistoryMode = "push" | "replace" | "transparent";

export interface H0Navigator extends EventTarget {
    navigate(info: RequestInfo, historyMode: HistoryMode): boolean;
    submitForm(form: HTMLFormElement, submitter?: HTMLElement | null): boolean;
    reload(): void;
}

export interface H0Spec {
    fetchModel: ((request: Request) => Promise<Response | null>) & {runtime? : "client-only" | "server-only"};
    renderView: (response: Response, rootElement: HTMLElement) => void;
    selectRoot: (root: Document) => Element;
    mount(root: HTMLElement, {window, h0}: {window: Window, h0: H0Navigator}): void;
    paths?: string[];
    scope: string;
    template: string;
}
