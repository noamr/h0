# H0 Documentation

## The Directory Structure

An H0 folder contains three entries:

### `template.h0.html`

This is your HTML view. Put your HTML here. Nothing magical about it. Except:

* H0 would load this HTML file into a `Document` object and run your `renderView` function in node
  (using [Linkedom](https://github.com/WebReflection/linkedom)) before serving it.

* If you import the `.h0/client.js` module, H0 would also operate on the client side, making this
  app into a "single-page application" (doesn't reload the whole page on interactions).

### `index.h0.ts`

This 


### `public/` *(optional)*

Put your static assets here: CSS, images, JS (preferrably not too much), fonts etc.