import {Model, Genre} from "../types";
import {arrayModel, reconcileChildren, templateView} from "../../../src/reconcile";
import { H0Navigator } from "../../../src/h0";
import { renderMovie } from "./movie";
import { renderPerson } from "./person";
import { renderMovieList } from "./movies";
import { renderGenreList } from "./genres";
import { renderPagination } from "./pagination";
import { renderHeader } from "./header";

export async function renderView(response: Response, element: Element) {
  const root = element as HTMLElement;
  const model = (await response.json()) as Model;
  root.querySelector("head title")!.innerHTML = model.docTitle;
  root.querySelector("body")!.dataset.path =  new URL(model.url).pathname;
  root.querySelector("body")!.classList.toggle("logged-in", model.loggedIn);

  renderHeader(root, model);
  renderMovie(root, model);
  renderPerson(root, model);
  renderMovieList(root, model);
  renderGenreList(root, "ul#genreList", model.genres);
  renderPagination(root, model);
}

export function mount(root: HTMLElement, {h0, window}: {h0: H0Navigator, window: Window}) {
  window.addEventListener("popstate", () => h0.navigate(window.location.href, "transparent"));
  const main = window.document.querySelector("main")!;
  const searchForm = root.querySelector("#searchForm")!;
  const searchBox = root.querySelector("input#searchBox")! as HTMLElement;
  searchForm.addEventListener("focus", () => searchBox.focus());
  h0.addEventListener("navigate", () => main.scrollTo(0, 0));
  document.addEventListener("load", ({target}) => {
    const img = target as HTMLImageElement;
    if (img.tagName === "IMG")
      img.classList.add("loaded");
  }, {capture: true});
}

export function selectRoot(doc: Document) { return doc.documentElement; }
