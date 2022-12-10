import { Model, MovieList } from "../types";
import {
  reconcileChildren,
  templateView,
  arrayModel,
} from "../../../src/reconcile";
import { renderMovieList } from "./movies";
export function renderLists(root: HTMLElement, model: Model) {
  if (!model.lists) return;

  reconcileChildren<MovieList>({
    model: arrayModel(model.lists || [], "id"),
    view: templateView({
      container: root.querySelector("#listOfLists")!,
      template: root.querySelector("template#listTemplate")!,
      updateItem: (li: Element, value: MovieList) => {
        li.querySelector("h2")!.innerHTML = value.name;
        li.querySelector("a")!.setAttribute(
          "href",
          `/list?id=${value.id}&page=1`
        );
        li.querySelector("span")!.innerHTML = `${value.items.length} movies`;
        li.querySelector("p")!.innerHTML = value.description;
      },
    }),
  });
}
