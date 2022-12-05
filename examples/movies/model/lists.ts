import {Movie, Person, Credits, categories, MoviesResult, Model, MovieList} from "../types";
import {tmdb, getDefaultModel, getSessionID} from "./api";

export async function getLists(request: Request) : Promise<Response> {
  const model =
    {...await getDefaultModel(request),
      docTitle: `H0 Movies - Lists`,
      title: 'Lists',
      subtitle: 'Searching'
    };
  const session_id = getSessionID(request);
  if (!session_id)
  // @ts-ignore
    return Response.json(model);
  const account = await tmdb<{id: number, name: string, username: string}>("/account", {session_id});
  model.title = `${account.name || account.username}'s Lists`;

  const lists = (await tmdb<{results: MovieList[]}>(`/account/${account.id}/lists`, {session_id})).results;
  // @ts-ignore
  return Response.json({...model,
     lists: await Promise.all(lists.map(async l => {
      const {items} = await tmdb<{items: Movie[]}>(`/list/${l.id}`, {session_id});
      return {...l, items};
    }))});
}

export async function addToList(request: Request): Promise<Response> {

}