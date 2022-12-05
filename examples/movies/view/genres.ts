import { Genre } from "../types";
import { reconcileChildren, templateView, arrayModel } from "../../../src/reconcile";
export function renderGenreList(root: HTMLElement, containerSelector: string, genres: Genre[]) {
  reconcileChildren<Genre>({
    model: arrayModel(genres, "id"),
    view: templateView({
      container: root.querySelector(containerSelector)!,
      template: root.querySelector("template#genreLink")!,
      updateItem: (li: Element, value: Genre) => {
        const a = li.querySelector("a") as HTMLAnchorElement;
        a.setAttribute("href", `/genre?id=${value.id}`);
        a.querySelector("span")!.innerHTML = value.name;
      }
    })
  });
}
