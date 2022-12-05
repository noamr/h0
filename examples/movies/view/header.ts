export function renderHeader(root: HTMLElement, {title, subtitle, searchTerm, url}: {title: string, subtitle: string, searchTerm?: string, url: string}) {
  root.querySelector("main > h1")!.innerHTML = title;
  root.querySelector("main > h2")!.innerHTML = subtitle;
  root.querySelector("input#searchBox")!.setAttribute("value", searchTerm || "");
  root.querySelector("form#loginForm input[name=next]")!.setAttribute("value", url);
}
