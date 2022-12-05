import { Model } from "../types";
import { imageURL } from "./util";
export function renderPerson(root: HTMLElement, model: Model) {
  const {person} = model;
  if (!person)
    return;

  const personRoot = root.querySelector("article#person")!;
  personRoot.querySelector("h1")!.innerHTML = person.name;
  personRoot.querySelector("h2")!.innerHTML = new Date(person.birthday).toLocaleDateString();
  personRoot.querySelector("#bio")!.innerHTML = person.biography;
  const artwork = personRoot.querySelector(".artwork")! as HTMLImageElement;
  artwork.setAttribute("src", imageURL(model, person.profile_path, 500));
  artwork.setAttribute("alt", person.name);
  personRoot.querySelector("a#imdb")!.setAttribute("href", person.imdb_id ? `https://www.imdb.com/name/${person.imdb_id}` : "#");
  personRoot.querySelector("a#website")!.setAttribute("href", person.homepage || "#");
}