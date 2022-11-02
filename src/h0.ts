declare global {
    var RUNTIME: "window" | "node";
}

export type HistoryMode = "push" | "replace" | "transparent";

export interface H0Navigator {
    navigate(info: RequestInfo, historyMode: HistoryMode): boolean;
    submitForm(form: HTMLFormElement, submitter?: HTMLElement | null): boolean;
    reload(): void;
}

export interface H0Spec {
    route?: (request: Request) => Promise<Response | null>;
    render: (response: Response, rootElement: HTMLElement) => void;
    selectRoot: (root: Document) => Element;
    mount(root: HTMLElement, {window, h0}: {window: Window, h0: H0Navigator}): void;
    scope: string;
    template: string;
}
