export const categories = {
  popular: "Popular",
  upcoming: "Upcoming",
  top_rated: "Top Rated",
};


export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  birthday: string;
  homepage: string | null;
  imdb_id: string;
}

export interface Credits {
  cast: Person[];
}

export interface Movie {
  poster_path: string;
  id: number;
  adult: boolean;
  overview: string;
  release_date: string;
  genre_ids: number[];
  genres?: Genre[];
  original_title: string;
  original_language: string;
  title: string;
  backdrop_path: string;
  popularity: number;
  vote_count: number;
  video: boolean;
  vote_average: number;
  tagline: string;
  runtime: number;
  imdb_id: string;
  homepage: string;
  trailer: string;
  cast: Person[];
}

export interface MoviesResult {
  page: number;
  results: Movie[];
  total_results: number;
  total_pages: number;
}

export interface Genre {
  name: string;
  id: number;
}

export interface Model {
  docTitle: string;
  title: string;
  page: number;
  subtitle: string;
  movies: Movie[];
  movie?: Movie;
  totalPages: number;
  url: string;
  genres: Genre[];
  categories: typeof categories;
  config: TMDBConfig;
  person?: Person;
  loggedIn: boolean;
  searchTerm?: string;
  lists?: MovieList[];
}

export interface TMDBConfig {
  images: {
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizess: string[];
  }
}

export interface MovieList {
  id: number;
  name: string;
  description: string;
  items: Movie[];
}

export interface Account {
  id: string;
  name: string;
  username: string;
}