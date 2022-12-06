import { login, logout, respondToAuth } from "./auth";
import { getCategory, getGenre, getMovie, getPerson, search } from "./content";
import { addToList, getLists, removeFromList } from "./lists";

export async function fetchModel(request: Request) : Promise<Response | null> {
  const url = new URL(request.url);

  const pages = {
    "/": getCategory,
    "/search": search,
    "/genre": getGenre,
    "/movie": getMovie,
    "/person": getPerson,
    "/login": login,
    "/auth": respondToAuth,
    "/my-lists": getLists,
    "/list/add": addToList,
    "/list/remove": removeFromList,
    "/logout": logout
  } as {[key: string]: (req: Request) => Promise<Response | null>};

  if (!(url.pathname in pages))
    return null;
  return pages[url.pathname](request);
}

fetchModel.runtime = "server-only";
