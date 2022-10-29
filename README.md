# H0 - The HTML-first library

H0 is a minimalistic Model-View library.

It aims to make it easier to write web applications that support both server and client-side rendering, but
without the complexity and overhead of declarative/reactive frameworks.

Write the same minimal JS to update your view, run it in node and in the browser, following a couple of principles to make it run optimally.

## An ultra-minimal example
``` html
<!-- hello/template.h0.html -->
<body>
    <div id="main">
        <output id="out"></output>
    </div>
</body>
```
``` typescript
// hello/index.h0.ts

// For anything in this path...
export const scope = "/hello/";

// Turn an HTTP-like request into a model wrapped an HTTP-like response
// This runs on the server or in the browser
export async function route(request: Request) {
    return Response.json({text: "Hello World"});
}

// Select the root element in the template that interacts with the model
// Forms & link descendants will cause an update without reloading
export function selectRoot(doc: Document) {
    return doc.querySelector("#main");
}

// Apply the HTTP-like response into an existing DOM
// This runs once on the server and/or multiple times in the browser!
export async function render(response: Response, view: Element) {
    const {text} = await response.json();
    view.querySelector("#out").innerHTML = text;
}

// Do extra browser-only things.
export async function mount(root: HTMLElement) {
    window.addEventListener(...)
}
```

```bash
# Run this (or from with a node API etc)
h0 hello
```

Now `http://localhost:3000/hello/` is an SPA with server-side rendering.

For a more detailed example, see `examples/todo-mvc`

## Design Goals



### Debugging Experience > Development Experience

### No magic

### No "reactive"

### No "declarative"

### No domain-specific languages