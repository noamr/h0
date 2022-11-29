
import {objectModel, arrayModel, reconcileChildren, templateView} from "../../src/reconcile";
import { H0Navigator } from "../../src/h0";

// TODO: use an environment variable like process.env.TMDB_API_KEY
const TMDB_API_VERSION = 3;
const TMDB_API_NEW_VERSION = 4;

const TMDB_API_BASE_URL = 'https://api.themoviedb.org';
const TMDB_BASE_URL = 'https://www.themoviedb.org';

const categories = {
  popular: "Popular",
  upcoming: "Upcoming",
  top_rated: "Top Rated",
};

interface Movie {
  poster_path: string;
  id: number;
  adult: boolean;
  overview: string;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  original_title: string;
  original_language: string;
  title: string;
  backdrop_path: string;
  popularity: number;
  vote_count: number;
  video: boolean;
  vote_average: number;
  tagline: string;
  runtime: number;
  imdb_id: string;
  homepage: string;
  trailer: string;
}

interface MoviesResult {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
}

interface Genre {
  name: string;
  id: number;
}

interface Model {
  docTitle: string;
  title: string;
  page: number;
  subtitle: string;
  movies: Movie[];
  movie?: Movie;
  totalPages: number;
  url: string;
  searchTerm: string;
  genres: Genre[];
  categories: typeof categories;
}

export const scope = "/";

let genres = null as null | Promise<Genre[]>;
export async function fetchModel(request: Request) : Promise<Response> {
  const {TMDB_API_KEY} = process.env;
  if (!TMDB_API_KEY) {
    throw new Error('Missing TMDB_API_KEY in env');
  }
  async function tmdb<Res>(path: string, params: {[key: string]: string | number} = {}) {
    const url = new URL(TMDB_API_BASE_URL);
    url.pathname = `/${TMDB_API_VERSION}${path}`;
    for (const k in params)
      url.searchParams.set(k, String(params[k]));
    url.searchParams.set("api_key", TMDB_API_KEY!);
    console.log(url.href);
    const res = await fetch(url.href, {mode: "cors"});
    return res.json() as Promise<Res>;
  }

  if (!genres)
    genres = tmdb<{genres: Genre[]}>("/genre/movie/list").then(result => result.genres);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || "popular";
  const id = url.searchParams.get("id");
  const searchTerm = url.searchParams.get("searchTerm") || "";
  const listId = url.searchParams.get("listId");

  if (!(category in categories)) {
    return new Response("", {status: 404})
  }

  const defaultModel = {
    genres: await genres!,
    categories,
    url: request.url,
    searchTerm,
    movies: [],
    title: "",
    subtitle: "",
    page: 1,
    totalPages: 1
  };

  switch (url.pathname) {
    case "/": {
      const result = await tmdb<MoviesResult>(`/movie/${category}`, {page});
      const title = categories[category as keyof typeof categories];

      const model : Model = {
        ...defaultModel,
        docTitle: `${title} Movies`,
        title,
        subtitle: "Movies",
        totalPages: result.total_pages,
        page: result.page,
        movies: result.results
      }
      // @ts-ignore
      return Response.json(model);
    }

    case "/search": {
      const result = await tmdb<MoviesResult>(`/search/movie`, {page, query: searchTerm});

      const model : Model = {
        ...defaultModel,
        docTitle: `${searchTerm} Movies`,
        title: searchTerm,
        subtitle: "Search Results",
        totalPages: result.total_pages,
        page: result.page,
        movies: result.results
      }
      // @ts-ignore
      return Response.json(model);
    }
    case "/genre": {
      const result = await tmdb<MoviesResult>(`/discover/movie`, {page, with_genres: id!});
      const genreTitle = (await genres).find(g => g.id === Number(id))?.name!;

      const model : Model = {
        ...defaultModel,
        docTitle: `${genreTitle} Movies`,
        title: genreTitle,
        subtitle: "Movies",
        totalPages: result.total_pages,
        page: result.page,
        movies: result.results
      }
      // @ts-ignore
      return Response.json(model);
    }
    case "/movie": {
      const movie = await tmdb<Movie>(`/movie/${id}`);

      const model : Model = {
        ...defaultModel,
        docTitle: `${movie.title} - Movie`,
        movie
      }
      // @ts-ignore
      return Response.json(model);
     }
    }
}

fetchModel.runtime = "server-only";

function imageURL(path : string | null, width : number) {
  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
  return path ? `${TMDB_IMAGE_BASE_URL}/w${width}${path}` : '/nothing.svg';
}

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
  const {page, totalPages, title, subtitle, movies, url, searchTerm, movie} = model;
  const urlRecord = new URL(url);
  root.querySelector("body")!.dataset.path = urlRecord.pathname;
  const next = page < totalPages ? new URL(url) : null;
  const prev = page > 1 ? new URL(url) : null;
  if (next)
    next.searchParams.set("page", String(page + 1));
  if (prev)
    prev.searchParams.set("page", String(page - 1));
  root.querySelector("h1")!.innerHTML = title;
  root.querySelector("h2")!.innerHTML = subtitle;
  const nextButton = root.querySelector("a#next")!;
  const prevButton = root.querySelector("a#prev")!;
  nextButton.removeAttribute("href");
  prevButton.removeAttribute("href");
  root.querySelector("input#searchBox")!.setAttribute("value", searchTerm);
  if (next)
    nextButton.setAttribute("href", next.href);
  if (prev)
    prevButton.setAttribute("href", prev.href);

  if (movie) {
    console.log(movie)
    const movieRoot = root.querySelector("article")!;
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
    movieRoot.querySelector(".artwork")!.setAttribute("src", imageURL(movie.poster_path, 780));
    movieRoot.querySelector(".rating")!.setAttribute("style", `--rating: ${ratingAsPercent(movie.vote_average)}`);
    movieRoot.querySelector("#additionalInfo")!.innerHTML = `${languageDisplayNames.of(movie.original_language)} / ${movie.runtime} min / ${new Date(movie.release_date).getFullYear()}`;
    movieRoot.querySelector("a#imdb")!.setAttribute("href", movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : "");
    movieRoot.querySelector("a#website")!.setAttribute("href", movie.homepage || "");
    movieRoot.querySelector("a#trailer")!.setAttribute("href", movie.trailer || "");
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
      updateItem: (element: Element, movie: Movie) => {
        element.setAttribute("href", `/movie?id=${movie.id}`);
        element.querySelector(".movieTitle")!.innerHTML = movie.title;
        element.querySelector(".rating")!.setAttribute("style", `--rating: ${ratingAsPercent(movie.vote_average)}`);
        element.querySelector(".posterImg")!.setAttribute("src", imageURL(movie.poster_path, 342));
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
  document.addEventListener("load", ({target}) => {
    const img = target as HTMLImageElement;
    if (img.tagName === "IMG") {
      img.classList.add("loaded");
    }
  }, {capture: true});

}

export function selectRoot(doc: Document) { return doc.documentElement; }
