
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

interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string;
  homepage: string | null;
  imdb_id: string;
}

interface Credits {
  cast: Person[];
}

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
  cast: Person[];
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
  config: TMDBConfig;
  person?: Person;
}

interface TMDBConfig {
  images: {
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizess: string[];
  }
}

export const scope = "/";

let genres = null as null | Promise<Genre[]>;
let config = null as null | Promise<TMDBConfig>;
export async function fetchModel(request: Request) : Promise<Response> {
  const {TMDB_API_KEY} = process.env;
  if (!TMDB_API_KEY) {
    throw new Error('Missing TMDB_API_KEY in env');
  }
  async function tmdb<Res>(path: string, params: {[key: string]: string | number} = {}, init?: RequestInit) {
    const url = new URL(TMDB_API_BASE_URL);
    url.pathname = `/${TMDB_API_VERSION}${path}`;
    for (const k in params)
      url.searchParams.set(k, String(params[k]));
    url.searchParams.set("api_key", TMDB_API_KEY!);
    const res = await fetch(url.href, {mode: "cors", ...init});
    return res.json() as Promise<Res>;
  }

  if (!config)
    config = tmdb<TMDBConfig>("/configuration");

  if (!genres)
    genres = tmdb<{genres: Genre[]}>("/genre/movie/list").then(result => result.genres);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || "popular";
  const id = url.searchParams.get("id");
  const searchTerm = url.searchParams.get("searchTerm") || "";

  if (!(category in categories)) {
    return new Response("", {status: 404})
  }

  const defaultModel = {
    genres: await genres!,
    config: await config,
    categories,
    url: request.url,
    searchTerm,
    movies: [],
    title: "",
    subtitle: "",
    page: 1,
    totalPages: 1,
    session_id: ""
  };

  if (url.searchParams.get("approved") === "true" && url.searchParams.has("request_token")) {
    const request_token = url.searchParams.get("request_token")!;
    const {session_id} = await tmdb<{session_id: string}>("/authentication/session/new", {}, {method: "post"});
    defaultModel.session_id = session_id;
  }


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
      const [movie, credits, recommendations] = await Promise.all([
        tmdb<Movie>(`/movie/${id}`),
        tmdb<Credits>(`/movie/${id}/credits`),
        tmdb<MoviesResult>(`/movie/${id}/recommendations`), {page}]);
      movie.cast = credits.cast;

      const model : Model = {
        ...defaultModel,
        docTitle: `${movie.title} - Movie`,
        title: "Recommended",
        subtitle: "Movies",
        movies: recommendations.results,
        page: recommendations.page,
        movie
      }
      // @ts-ignore
      return Response.json(model);
    }
    case "/person": {
      const [person, movies] = await Promise.all([
        tmdb<Person>(`/person/${id}`),
        tmdb<{cast: Movie[]}>(`/person/${id}/movie_credits`)]);
      const model : Model = {
        ...defaultModel,
        docTitle: `${person.name} - Person`,
        page: 1,
        movies: movies.cast,
        title: person.name,
        subtitle: "Appeared In:",
        person
      }
      // @ts-ignore
      return Response.json(model);
     }

     case "/login": {
      const {request_token, success, expires_at} = await tmdb<{request_token: string, success: boolean, expires_at: string}>("/authentication/token/new");
      if (!success) {
        return new Response(JSON.stringify({message: "Could not initiate request"}), {headers: {
          "Content-Type": "application/json"
        }, status: 403});
      }
      const next = url.searchParams.get("next")!;
      const auth = new URL(`/auth`, next);
      auth.searchParams.set("next", next);
      auth.searchParams.set("expires_at", expires_at);
      const tmdb_auth = new URL(`https://www.themoviedb.org/authenticate/${request_token}`);
      tmdb_auth.searchParams.set("redirect_to", auth.toString());
      return Response.redirect(tmdb_auth.toString());
     }

     case "/auth": {
      const request_token = url.searchParams.get("request_token");
      const approved = !!url.searchParams.get("approved");
      const expires_at = url.searchParams.get("expires_at");
      const next = url.searchParams.get("next") || new URL("/", request.url);
      if (!approved)
        return Response.redirect(next);

      const {session_id, success} = await tmdb<{success: true, session_id: string}>("/authentication/session/new", {},
      {method: "post", body: JSON.stringify({request_token}), headers: {"Content-Type": "application/json"}});

      if (!success)
        return Response.redirect(next);

      return new Response("", {status: 302, headers: {
        "Location": next.toString(),
        "Set-Cookie": `tmdb_session_id=${session_id}; Expires=${expires_at}`
      }});
     }
    }
}

fetchModel.runtime = "server-only";

function ratingAsPercent(r: number) {
  return `${r * 10}%`;
}
function updateGenreLink(li: Element, value: Genre) {
  const a = li.querySelector("a") as HTMLAnchorElement;
  a.setAttribute("href", `/genre?id=${value.id}`);
  a.querySelector("span")!.innerHTML = value.name;
}

const languageDisplayNames = new Intl.DisplayNames(['en'], {type: "language"});
export const paths = ["/", "/movie", "/genre", "/search", "/person"];

export async function renderView(response: Response, root: Element) {
  const model = (await response.json()) as Model;
  function imageURL(path : string | null, width : number) {
    return path ? `${model.config.images.secure_base_url}/w${width}${path}` : '/nothing.svg';
  }

  const {page, totalPages, title, subtitle, movies, url, searchTerm, movie, person} = model;
  root.querySelector("head title")!.innerHTML = model.docTitle;
  const urlRecord = new URL(url);
  root.querySelector("body")!.dataset.path = urlRecord.pathname;
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
  root.querySelector("input#searchBox")!.setAttribute("value", searchTerm);
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
