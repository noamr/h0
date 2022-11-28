addEventListener("fetch", e => {
  if (e.request.destination !== "image" ||   // Only do this when requesting an image
    request.mode === "no-cors") // We don't know the status of no-cors images
    return;

  e.respondWith((async () => {
    try {
      const response = await fetch(e.request);
      if (response.ok)
        return response;
    } catch {
    }
    return Response.redirect("/nothing.svg");
  })());

});