import {reconcileChildren, templateView} from "../../../src/reconcile";
import {Movie, Model} from "../types";
import {imageURL} from "./util";

export function renderMovieList(root: HTMLElement, model: Model, movies?: Movie[], selector?: string) {
  reconcileChildren<Movie>({
    view: templateView({
      container: root.querySelector(selector || "#movieList")!,
      template: root.querySelector("#movieTemplate") as HTMLTemplateElement,
      keyAttribute: "id",
      hashAttribute: "id",
      updateItem: (element: Element, movie: Movie, key, index) => {
        element.querySelector("a")!.setAttribute("href", `/movie?id=${movie.id}`);
        element.querySelector(".movieTitle")!.innerHTML = movie.title;
        element.querySelector(".rating")!.setAttribute("style", `--rating: ${movie.vote_average}`);
        const poster = element.querySelector(".posterImg")!;
        poster.setAttribute("loading", index === 0 ? "eager" : "lazy");
        poster.setAttribute("src", imageURL(model, movie.poster_path, 500));
        element.querySelector(".posterImg")!.setAttribute("alt", `Poster for ${movie.title}`);
      }
    }),
    model: {
      entries: movies || model.movies,
      getKey: m => String(m.id),
      getHash: m => String(m.id),
      getValue: m => m
    }
  })
}
