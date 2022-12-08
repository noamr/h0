import { Model } from "../types";
import { H0Navigator } from "../../../src/h0";
import { renderMovie } from "./movie";
import { renderPerson } from "./person";
import { renderMovieList } from "./movies";
import { renderGenreList } from "./genres";
import { renderPagination } from "./pagination";
import { renderHeader } from "./header";
import { renderLists } from "./lists";

function renderGeneralDocumentStuff(root: HTMLElement, model: Model) {
  root.querySelector("head title")!.innerHTML = model.docTitle;
  root.querySelector("body")!.dataset.path =  new URL(model.url).pathname;
  root.querySelector("body")!.classList.toggle("logged-in", model.loggedIn);
}

function renderNav(root: HTMLElement, model: Model) {
  renderGenreList(root, "ul#genreList", model.genres);
}

export async function renderView(response: Response, element: Element) {
  const root = element as HTMLElement;
  const model = (await response.json()) as Model;
  for (const renderer of [
      renderGeneralDocumentStuff,
      renderHeader,
      renderNav,
      renderMovieList,
      renderPagination,

      renderMovie,
      renderPerson,
      renderLists
  ]) {
    renderer(root, model);
  }
}

export function mount(root: HTMLElement, {h0, window}: {h0: H0Navigator, window: Window}) {
  // Scroll to top when navigating
  h0.addEventListener("navigate", () => root.querySelector("main")!.scrollTo(0, 0));
}

export function selectRoot(doc: Document) { return doc.documentElement; }
