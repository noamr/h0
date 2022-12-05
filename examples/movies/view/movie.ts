import { reconcileChildren, arrayModel, templateView } from "../../../src/reconcile";
import { Model, Person } from "../types";
import { languageDisplayNames, imageURL } from "./util";
import { renderGenreList } from "./genres";
export function renderMovie(root: HTMLElement, model: Model) {
  const {movie} = model;
  if (!movie)
    return;

    const movieRoot = root.querySelector("article#movie")!;
  movieRoot.querySelector("h1")!.innerHTML = movie.title;
  movieRoot.querySelector("h2")!.innerHTML = movie.tagline;
  renderGenreList(root, "ul#movieGenresList", movie.genres || []);
  movieRoot.querySelector("#synopsys")!.innerHTML = movie.overview;
  const artwork = movieRoot.querySelector(".artwork")! as HTMLImageElement;
  artwork.setAttribute("src", imageURL(model, movie.poster_path, 500));
  artwork.setAttribute("alt", `Poster for ${movie.title}`);
  movieRoot.querySelector(".rating")!.setAttribute("style", `--rating: ${movie.vote_average}`);
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
        img.setAttribute("src", person.profile_path ? imageURL(model, person.profile_path, 45) : "/person.svg");
        img.setAttribute("alt", person.name);
        anchor.setAttribute("href", `/person?id=${person.id}`);
      }
    })
  })  
}