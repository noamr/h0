export interface H0Spec {
    route?: (request: Request) => Promise<Response | null>;
    render: (response: Response, rootElement: HTMLElement) => void;
    selectRoot: (root: Document) => Element;
    mount(root: HTMLElement, {window, h0}: {window: Window, h0: Navigator}): void;
    scope: string;
    template: string;
}
