# H0 - The HTML-first library

H0 is a minimalistic Model-View library.

It aims to make it easier to write web applications that support both server and client-side rendering, but
without the complexity and overhead of declarative/reactive frameworks.

Write the same minimal JS to update your view, run it in node and in the browser, following a couple of principles to make it run optimally.

## The Concept

Your view is an HTML file. You can consider it as a "master" HTML file, or the template.
You fill it with data using two functions: `route` and `render`.
Each of those functions can run on the server and/or in the browser.

### How it works

- Choose the root URL path of your app (e.g. `/my-app/`)
- Build a standard HTML file with your view in it.
- Choose the root element of your view in your HTML file. By default it would be the document (`HTML`) element.
- Write your `route` function: handle any `Request` that matches the root URL path, returning a `Response` with your view-model.
  Your `route` function should run on the server and/or the client.
- Write your `render` function: take the `Response` you received and apply it to the DOM.
  Your `render` function should run on the client and/or the server.
- Write your `mount` function (optionally) to add any custom event handlers.
- If you want your app to be an SPA, import the generated bundle as an ES module. H0 will intercept your navigations.

You're good to go!


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

// Do extra browser-only things .
export async function mount(root: HTMLElement) {
    window.addEventListener(...)
}
```

```bash
# Run this (or from with a node API etc)
h0 hello
```

Now `http://localhost:3000/hello/` is an SPA with server-side rendering.


https://todo-mvc.onrender.com/todos/

## Design Principles

### HTML first

Your view is a plain HTML file. Serving it unmodified should "just work".
There is no HTML-in-JS, CSS-in-JS, JSX-in-template-strings.

### Clean, stable DOM

To make the most out of H0 - keep the DOM hierarchy somewhat stable. You can easily turn parts of the DOM dormant
by giving them `display: none` in CSS. The exception is lists with a number of elements that's derived
from the model.

By having a stable DOM hierarchy, there is less need for acrobatics such as the virtual DOM. Updating
DOM attributes, contents and classes via selectors is clean and easy, you don't have to worry about whther
a particular element exists or was removed, and entry/exit transitions are straightforward.

### "View Model" rendering

Most frontend dev today relies on the concept of a "view model" - holding the state of the application in a JSON-like structure
and then mapping it to the DOM in an efficient way. Modern frameworks allow "server-side rendering": the description of
how the model is mapped to the view can be applied both in the client and on the server.

H0 provides model->view rendering, including server-side rendering and ways to efficiently update the DOM,
but does not provide anything else.

### List mapping

### Hashing

### No Magic, No lock-in

#### Not "declarative"

Modern frameworks are declarative: the have some language (JSX, Svelte) or templating DSL (Lit) to map the model to the view.

Declarativity is "magic" - the efficient mapping is done "behind the scenes". This forces you to write your code in a framework-specific way,
and porting it is difficult.

In H0, the model->view mapping is not declarative. The only declarative layer is HTML/CSS. You serve your entire DOM with HTML
perhaps with some template elements, and perform changes with JavaScript.

#### Not "reactive"

Modern frameworks are reactive: they provide some way for the view to react to events and apply changes, e.g. React hooks.

Reactivity is "magic" - behind the scenes the framework has to work hard to schedule how and when different changes apply
and which parts of the DOM need to be updated as a result.

H0 is not reactive. It's a request/response model, like the traditional web. You can still use the inherent reactivity in the DOM,
by using CSS and web components.

#### No "components"

Since H0 relies on pure JS functions (`route` and `render`), and on raw HTML, there is no need for an additional component model.
You can use existing JS-based modular enablers like ESM, and HTML modular enablers like web-components and the template element.

### Debugging Experience (aka DX)

By having no magic, the code you write is 100% the code you run (well maybe except TS transpilation), so debugging is a lot more straightforward.
And by following some design principles, you shouldn't end up with verbose or hard-to-read code.


## TODO-MVC example

### Live version
See live [here](https://todo-mvc.onrender.com/todos/)

### Code
See `examples/todo-mvc`

### Explanation

* Interactions are (predominantly) forms and links (`<a href>`).
* "Write" actions are different POST paths, like a standard multi-page web application
* The `render` function updates the view based on the list of tasks, with the special `reconcileChildren` function to efficiently map the task list to the DOM.