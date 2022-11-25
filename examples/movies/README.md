# Movies app

This is a vanilla/h0 implementation of the [TasteJS movie app](https://github.com/tastejs/next-movies).
Most of the CSS is copied from the above link.

## To run
- Get a [TMDB API key](https://developers.themoviedb.org/3/getting-started)
- nvm use
- npm i
- export TMDB_API_KEY=<your key>
- node ./cli.js --ssr --dir examples/movies --port 8000 -u examples/movies/public
- http://localhost:8000

## Principles of development
- If it can be done with HTML/CSS, do it with HTML/CSS
- Prefer to use DOM semantics and adjust the style to that, rather than use classes for everything. Classes should rarely be needed.
- If your JS or CSS gets complicated, the first place to look is the structure of the HTML.
- You probably don't need components (maybe here and there).