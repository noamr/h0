import {Account, Genre, TMDBConfig, Movie, MovieList, categories} from "../types";
// TODO: use an environment variable like process.env.TMDB_API_KEY
const TMDB_API_VERSION = 3;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org';

export async function tmdb<Res>(path: string, params: {[key: string]: string | number} = {}, init?: RequestInit) {
  const {TMDB_API_KEY} = process.env;
  if (!TMDB_API_KEY) {
    throw new Error('Missing TMDB_API_KEY in env');
  }

  const url = new URL(TMDB_API_BASE_URL);
  url.pathname = `/${TMDB_API_VERSION}${path}`;
  for (const k in params)
    url.searchParams.set(k, String(params[k]));
  url.searchParams.set("api_key", TMDB_API_KEY!);
  const res = await fetch(url.href, {mode: "cors", ...init});
  const json = res.json() as Promise<Res>;
  console.log(path, await json);
  return json;
}


export async function tmdb_post<Res>(path: string, params: {[key: string]: string | number} = {}, body: any) {
  return tmdb<Res>(path, params, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
}

export function getSessionID(request: Request) {
  const cookie = request.headers.get("Cookie");
  return cookie ? cookie.match(/tmdb_session_id\=([a-z0-9]+)/)?.[1] : null;
}

export async function getMovieLists(account: Account, session_id: string) {
  const lists = (await tmdb<{results: MovieList[]}>(`/account/${account.id}/lists`, {session_id})).results;
  return Promise.all(lists.map(async l => {
      const {items} = await tmdb<{items: Movie[]}>(`/list/${l.id}`, {session_id});
      return {...l, items};
  }));
}

export async function getDefaultModel(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const session_id = getSessionID(request);
  const account = session_id ? await tmdb<Account>("/account", {session_id}) : null;
  const [genres, config, lists] = await Promise.all([tmdb<{genres: Genre[]}>("/genre/movie/list").then(result => result.genres),
     tmdb<TMDBConfig>("/configuration"), (account && session_id) ? getMovieLists(account, session_id) : []]);

  return {
    account,
    genres,
    config,
    categories,
    url: request.url,
    movies: [],
    title: "",
    subtitle: "",
    lists,
    page: +page,
    totalPages: 1,
    loggedIn: !!getSessionID(request)
    };
}