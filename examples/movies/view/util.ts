import {Model} from "../types";

export function imageURL(model: Model, path : string | null, width : number) {
  return path ? `${model.config.images.secure_base_url}/w${width}${path}` : '/nothing.svg';
}

export const languageDisplayNames = new Intl.DisplayNames(['en'], {type: "language"});

