import {Movie, Person, Credits, categories, MoviesResult, Model} from "../types";
import {tmdb, getDefaultModel} from "./api";

export async function getCategory(request: Request) {
  const url = new URL(request.url);
  const defaultModel = await getDefaultModel(request);
  const category = url.searchParams.get("category") || "popular";

  if (!(category in categories)) {
    return new Response("", {status: 404})
  }

  const result = await tmdb<MoviesResult>(`/movie/${category}`, {page: defaultModel.page});
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

export async function search(request: Request) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("searchTerm") || "";
  const defaultModel = await getDefaultModel(request);
  const result = await tmdb<MoviesResult>(`/search/movie`, {page: defaultModel.page, query: searchTerm});

  const model : Model = {
    ...defaultModel,
    docTitle: `${searchTerm} Movies`,
    title: searchTerm,
    subtitle: "Search Results",
    totalPages: result.total_pages,
    page: result.page,
    movies: result.results,
    searchTerm
  }
  // @ts-ignore
  return Response.json(model);
}

export async function getGenre(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const defaultModel = await getDefaultModel(request);
  const result = await tmdb<MoviesResult>(`/discover/movie`, {page: defaultModel.page, with_genres: id!});
  const genreTitle = defaultModel.genres.find(g => g.id === Number(id))?.name!;

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

export async function getPerson(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const [person, movies] = await Promise.all([
    tmdb<Person>(`/person/${id}`),
    tmdb<{cast: Movie[]}>(`/person/${id}/movie_credits`)]);
  const defaultModel = await getDefaultModel(request);
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

export async function getMovie(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const [defaultModel, movie, credits, recommendations] = await Promise.all([
    getDefaultModel(request),
    tmdb<Movie>(`/movie/${id}`),
    tmdb<Credits>(`/movie/${id}/credits`),
    tmdb<MoviesResult>(`/movie/${id}/recommendations`), {page: url.searchParams.get("page") || "1"}]);
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