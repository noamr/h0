import { HTMLDocument } from "linkedom/types/html/document";
import { Client } from "./client";

export type Document = globalThis.Document | HTMLDocument;
export type Element = globalThis.Element | HTMLElement;

export interface H0Spec {
    route?: (request: Request) => Promise<Response | null>;
    render: (response: Response, rootElement: HTMLElement) => void;
    selectRoot: (root: Document) => Element;
    mount(root: HTMLElement, {window, h0}: {window: Window, h0: Client}): void;
    scope: string;
    template: string;
}
