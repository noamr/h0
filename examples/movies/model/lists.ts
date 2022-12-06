import {Movie, Person, Credits, categories, MoviesResult, Model, MovieList} from "../types";
import {tmdb_post, getDefaultModel, getSessionID} from "./api";

interface ActionResult {
  status_code: number;
  status_message: string;
}

export async function getLists(request: Request) : Promise<Response> {
  const model =
    {...await getDefaultModel(request),
      docTitle: `H0 Movies - Lists`,
      title: 'Lists',
      subtitle: 'Lists'
    };
  model.title = `${model.account?.name || model.account?.username || "Not logged in"}`;
  // @ts-ignore
  return Response.json(model);
}

async function addOrRemove(request: Request, op: "add" | "remove") {
  if (request.method !== "POST")
    return new Response("Invalid method", {status: 405});

  const url = new URL(request.url);
  const listID = url.searchParams.get("list_id");
  const session_id = getSessionID(request);
  if (!session_id)
    return new Response("Not logged in", {status: 403});

  if (!listID)
    return new Response("List ID not found", {status: 400});
  console.log(request);
  const body = await request.formData();
  const movieID = body.get("movie_id");
  if (!movieID)
    return new Response("Movie ID not found", {status: 400});
  const result = await tmdb_post<ActionResult>(`/list/${listID}/${op}_item`, {session_id}, {media_id: movieID});
  return new Response(result.status_message, {status: 201});
}

export async function addToList(request: Request): Promise<Response> {
  console.log(request);
  return addOrRemove(request, "add");
}

export async function removeFromList(request: Request): Promise<Response> {
  return addOrRemove(request, "remove");
}
