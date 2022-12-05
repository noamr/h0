import {Model, Genre, Movie, Person} from "./types";
import {arrayModel, reconcileChildren, templateView} from "../../src/reconcile";
import { H0Navigator } from "../../src/h0";

function ratingAsPercent(r: number) {
  return `${r * 10}%`;
}
function updateGenreLink(li: Element, value: Genre) {
  const a = li.querySelector("a") as HTMLAnchorElement;
  a.setAttribute("href", `/genre?id=${value.id}`);
  a.querySelector("span")!.innerHTML = value.name;
}

const languageDisplayNames = new Intl.DisplayNames(['en'], {type: "language"});

export async function renderView(response: Response, root: Element) {
  const model = (await response.json()) as Model;
  function imageURL(path : string | null, width : number) {
    return path ? `${model.config.images.secure_base_url}/w${width}${path}` : '/nothing.svg';
  }

  console.log(model)

  const {page, totalPages, title, subtitle, movies, url, searchTerm, movie, person, loggedIn} = model;
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

  if (movie) {
    const movieRoot = root.querySelector("article#movie")!;
    movieRoot.querySelector("h1")!.innerHTML = movie.title;
    movieRoot.querySelector("h2")!.innerHTML = movie.tagline;
    reconcileChildren<Genre>({
      model: arrayModel(movie.genres!, "id"),
      view: templateView({
        container: movieRoot.querySelector("ul#movieGenresList")!,
        template: root.querySelector("template#genreLink")!,
        updateItem: updateGenreLink
      })
    });
    movieRoot.querySelector("#synopsys")!.innerHTML = movie.overview;
    const artwork = movieRoot.querySelector(".artwork")! as HTMLImageElement;
    artwork.setAttribute("src", imageURL(movie.poster_path, 500));
    artwork.setAttribute("alt", `Poster for ${movie.title}`);
    movieRoot.querySelector(".rating")!.setAttribute("style", `--rating: ${ratingAsPercent(movie.vote_average)}`);
    movieRoot.querySelector("#additionalInfo")!.innerHTML = `${languageDisplayNames.of(movie.original_language)} / ${movie.runtime} min / ${new Date(movie.release_date).getFullYear()}`;
    movieRoot.querySelector("a#imdb")!.setAttribute("href", movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : "");
    movieRoot.querySelector("a#website")!.setAttribute("href", movie.homepage || "#");
    movieRoot.querySelector("a#trailer")!.setAttribute("href", movie.trailer || "#");
    reconcileChildren<Person>({
      model: arrayModel(movie.cast! || [], "id"),
      view: templateView({
        container: movieRoot.querySelector("#castList")!,
        template: root.querySelector("template#castPerson")!,
        updateItem: (listItem, person) => {
          const anchor = listItem.querySelector("a")!
          anchor.setAttribute("title", person.name);
          const img = listItem.querySelector("img") as HTMLImageElement;
          img.setAttribute("src", person.profile_path ? imageURL(person.profile_path, 45) : "/person.svg");
          img.setAttribute("alt", person.name);
          anchor.setAttribute("href", `/person?id=${person.id}`);
        }
      })
    })
  } else if (person) {
    const personRoot = root.querySelector("article#person")!;
    personRoot.querySelector("h1")!.innerHTML = person.name;
    personRoot.querySelector("h2")!.innerHTML = new Date(person.birthday).toLocaleDateString();
    personRoot.querySelector("#bio")!.innerHTML = person.biography;
    const artwork = personRoot.querySelector(".artwork")! as HTMLImageElement;
    artwork.setAttribute("src", imageURL(person.profile_path, 500));
    artwork.setAttribute("alt", person.name);
    personRoot.querySelector("a#imdb")!.setAttribute("href", person.imdb_id ? `https://www.imdb.com/name/${person.imdb_id}` : "#");
    personRoot.querySelector("a#website")!.setAttribute("href", person.homepage || "#");
  }

  reconcileChildren<Genre>({
    model: arrayModel(model.genres, "id"),
    view: templateView({
      container: root.querySelector("ul#genreList")!,
      template: root.querySelector("template#genreLink")!,
      updateItem: updateGenreLink
    })
  });

  reconcileChildren<Movie>({
    view: templateView({
      container: root.querySelector("#movieList")!,
      template: root.querySelector("#movieTemplate") as HTMLTemplateElement,
      keyAttribute: "id",
      updateItem: (element: Element, movie: Movie, key, index) => {
        element.querySelector("a")!.setAttribute("href", `/movie?id=${movie.id}`);
        element.querySelector(".movieTitle")!.innerHTML = movie.title;
        element.querySelector(".rating")!.setAttribute("style", `--rating: ${ratingAsPercent(movie.vote_average)}`);
        const poster = element.querySelector(".posterImg")!;
        poster.setAttribute("loading", index === 0 ? "eager" : "lazy");
        poster.setAttribute("src", imageURL(movie.poster_path, 500));
        element.querySelector(".posterImg")!.setAttribute("alt", `Poster for ${movie.title}`);
      }
    }),
    model: {
      entries: movies,
      getKey: m => String(m.id),
      getValue: m => m
    }
  })
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
