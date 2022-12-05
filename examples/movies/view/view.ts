import {Model, Genre} from "../types";
import {arrayModel, reconcileChildren, templateView} from "../../../src/reconcile";
import { H0Navigator } from "../../../src/h0";
import { renderMovie } from "./movie";
import { renderPerson } from "./person";
import { renderMovieList } from "./movies";
import { renderGenreList } from "./genres";
export async function renderView(response: Response, root: Element) {
  const model = (await response.json()) as Model;

  const {page, totalPages, title, subtitle, url, searchTerm, loggedIn} = model;
  root.querySelector("head title")!.innerHTML = model.docTitle;
  const urlRecord = new URL(url);
  root.querySelector("body")!.dataset.path = urlRecord.pathname;
  root.querySelector("body")!.classList.toggle("logged-in", loggedIn);
  const next = page < totalPages ? new URL(url) : null;
  const prev = page > 1 ? new URL(url) : null;
  if (next)
    next.searchParams.set("page", String(page + 1));
  if (prev)
    prev.searchParams.set("page", String(page - 1));
  root.querySelector("main > h1")!.innerHTML = title;
  root.querySelector("main > h2")!.innerHTML = subtitle;
  const nextButton = root.querySelector("a#next")!;
  const prevButton = root.querySelector("a#prev")!;
  root.querySelector("input#searchBox")!.setAttribute("value", searchTerm || "");
  if (next)
    nextButton.setAttribute("href", next ? next.href : "#");
  if (prev)
    prevButton.setAttribute("href", prev ? prev.href : "#");

  root.querySelector("form#loginForm input[name=next]")!.setAttribute("value", model.url);

  renderMovie(root as HTMLElement, model);
  renderPerson(root as HTMLElement, model);
  renderMovieList(root as HTMLElement, model);
  renderGenreList(root as HTMLElement, "ul#genreList", model.genres);
}

export function mount(root: HTMLElement, {h0, window}: {h0: H0Navigator, window: Window}) {
  window.addEventListener("popstate", () => h0.navigate(window.location.href, "transparent"));
  root.querySelector("header form")!.addEventListener("focus", () => {
    (root.querySelector("input#searchBox")! as HTMLElement).focus();
  })
  h0.addEventListener("navigate", () => {
    window.document.querySelector("main")!.scrollTo(0, 0);
  });
  document.addEventListener("load", ({target}) => {
    const img = target as HTMLImageElement;
    if (img.tagName === "IMG") {
      img.classList.add("loaded");
    }
  }, {capture: true});

}

export function selectRoot(doc: Document) { return doc.documentElement; }
