addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.headers["Accept"].startsWith("image/")) {
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