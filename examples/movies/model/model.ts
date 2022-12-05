import { login, logout, respondToAuth } from "./auth";
import { getCategory, getGenre, getMovie, getPerson, search } from "./content";

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
    "/logout": logout
  } as {[key: string]: (req: Request) => Promise<Response | null>};

  if (!(url.pathname in pages))
    return null;
  return await pages[url.pathname](request);
}

fetchModel.runtime = "server-only";
