import { H0Navigator } from "./h0";

export interface BehaviorArgs {
  h0: H0Navigator;
  rootElement: HTMLElement;
}

// Refresh data on "Back"
export function captureHistoryTraversal({ h0 }: BehaviorArgs) {
  window.addEventListener("popstate", () => h0.reload());
}

export function captureSubmits({ h0, rootElement }: BehaviorArgs) {
  (rootElement as HTMLElement).addEventListener("submit", (e: SubmitEvent) => {
    if (h0.submitForm(e.target as HTMLFormElement, e.submitter))
      e.preventDefault();
  }, { capture: true });
}

export function captureLinks({ h0, rootElement }: BehaviorArgs) {
  (rootElement as HTMLElement).addEventListener("click", async (e: MouseEvent) => {
    if ((e.target instanceof HTMLAnchorElement) && h0.navigate((e.target as HTMLAnchorElement).href, "push"))
      e.preventDefault();
  }, { capture: true });
}
