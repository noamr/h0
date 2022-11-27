const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.headers["Accept"].startsWith("image/")) {
    e.respondWith((async () => {
      try {
        const imageURL = `${TMDB_IMAGE_BASE_URL}/w${width}${path}`;
        return await fetch(imageURL, {mode: "no-cors"});
      } catch (e) {
        return Response.redirect("/nothing.svg");
      }
    })());
  }
});