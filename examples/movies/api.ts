import {Genre, TMDBConfig, categories} from "./types";
// TODO: use an environment variable like process.env.TMDB_API_KEY
const TMDB_API_VERSION = 3;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org';

let genres = null as null | Promise<Genre[]>;
let config = null as null | Promise<TMDBConfig>;

const {TMDB_API_KEY} = process.env;
if (!TMDB_API_KEY) {
  throw new Error('Missing TMDB_API_KEY in env');
}

export async function tmdb<Res>(path: string, params: {[key: string]: string | number} = {}, init?: RequestInit) {
  const url = new URL(TMDB_API_BASE_URL);
  url.pathname = `/${TMDB_API_VERSION}${path}`;
  for (const k in params)
    url.searchParams.set(k, String(params[k]));
  url.searchParams.set("api_key", TMDB_API_KEY!);
  const res = await fetch(url.href, {mode: "cors", ...init});
  return res.json() as Promise<Res>;
}

export async function getDefaultModel(request: Request) {
  const cookie = request.headers.get("Cookie");
  const session_id = cookie ? cookie.match(/tmdb_session_id\=([a-z0-9]+)/)?.[1] : null;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");

  if (!config)
    config = tmdb<TMDBConfig>("/configuration");

  if (!genres)
    genres = tmdb<{genres: Genre[]}>("/genre/movie/list").then(result => result.genres);

   return {
      genres: await genres!,
      config: await config,
      categories,
      url: request.url,
      movies: [],
      title: "",
      subtitle: "",
      page: +page,
      totalPages: 1,
      loggedIn: !!session_id
    };
}