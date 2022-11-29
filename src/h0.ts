type Runtime = "window" | "node";
declare global {
    var RUNTIME: Runtime;
}

export type HistoryMode = "push" | "replace" | "transparent";

export interface H0Navigator {
    navigate(info: RequestInfo, historyMode: HistoryMode): boolean;
    reload(): void;
}

export interface H0Spec {
    fetchModel: ((request: Request) => Promise<Response | null>) & {runtime? : "client-only" | "server-only"};
    renderView: (response: Response, rootElement: HTMLElement) => void;
    selectRoot: (root: Document) => Element;
    mount(root: HTMLElement, {window, h0}: {window: Window, h0: H0Navigator}): void;
    scope: string;
    template: string;
}
