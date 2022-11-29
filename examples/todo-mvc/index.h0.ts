
import {reconcileChildren, templateView, arrayModel} from "../../src/reconcile";
import { H0Navigator } from "../../src/h0";

// Spec: https://github.com/tastejs/todomvc/blob/master/app-spec.md
interface Task {
    id: string;
    title: string;
    completed: boolean;
}

interface Model {
    tasks: Task[]
}

export const scope = "/todos/";

export async function fetchModel(request: Request) : Promise<Response> {
    // As per spec, get the stored list
    const fromStorage = (typeof localStorage === "undefined") ? [] : JSON.parse(localStorage.getItem("todos") || "[]");
    const tasks = new Map<string, Task>(fromStorage);

    const save = () => localStorage.setItem("todos", JSON.stringify(Array.from(tasks.entries())));

    const url = new URL(request.url);

    switch (request.method) {
    case "POST": {
        // Set a POST request path for each "write" operation
        switch (url.pathname) {
            case "/todos/toggle":
                const completed = !!(await request.formData()).get("completed");
                for (const [k, v] of tasks.entries())
                    v.completed = completed;
                break;
            case "/todos/purge":
                for (const [k, v] of tasks.entries())
                    if (v.completed)
                        tasks.delete(k);
                break;
            case "/todos/add": {
                const title = (await request.formData()).get("title");
                const id = crypto.randomUUID();
                if (title)
                    tasks.set(id, {id, title: title as string, completed: false});
                break;
            }
            case "/todos/edit": {
                const d = await request.formData();
                const title = d.get("title");
                const id = d.get("id") as string;
                const completed = d.get("completed");
                if (title)
                    tasks.set(id, {id, title: title as string, completed: !!completed});
                break;
            }
            case "/todos/delete": {
                const d = await request.formData();
                const id = d.get("id") as string;
                tasks.delete(id);
            }

        }
        save();

        // Redirect back to the scope URL after posting, to avoid changing history
        return Response.redirect(scope);
    }

    // Pass on the tasks as JSON
    case "GET":
    default:
        return new Response(JSON.stringify({tasks: Array.from(tasks.values())}), {headers: {"Content-Type": "application/json"}});
    }
}

fetchModel.runtime = "client-only";

export async function renderView(response: Response, root: Element) {
    const document = root.ownerDocument;

    const {tasks} = (await response.json()) as Model;

    // Perform filter when rendering, because it depends on location.hash
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    root.querySelector("#activeCount")!.innerHTML = `${active.length} task${active.length === 1 ? "" : "s"} remaining`;
    const list = root.querySelector(".todo-list")!;

    reconcileChildren<Task>({
        model: arrayModel(
            (RUNTIME == "node" ? tasks : (location.hash === "#/completed" ? completed : location.hash === "#/active" ? active : tasks)), "id"),
        view: templateView({
            container: list,
            template: document.querySelector(".item-template")!,
            keyAttribute: "data-id",
            updateItem: (element, task: Task) => {
                if (task.completed)
                    element.querySelector('input[name="completed"]')!.setAttribute("checked", "checked");
                else
                    element.querySelector('input[name="completed"]')!.removeAttribute("checked");

                element.querySelector("input[name=title]")!.setAttribute("value", task.title);
                element.querySelector("input[name=id]")!.setAttribute("value", task.id);
            }
        })
    });
    root.setAttribute("has-completed", completed.length ? "true" : "false");
    root.setAttribute("has-tasks", tasks.length ? "true" : "false");
}

export function mount(root: HTMLElement, {window, h0}: {window: Window, h0: H0Navigator}) {
    window.addEventListener("hashchange", () => h0.reload());
    const list = root.querySelector(".todo-list") as HTMLUListElement;

    list.addEventListener("change", e => {
        if ((e.target as HTMLInputElement)?.name === "completed")
            (e.target as HTMLInputElement).form!.requestSubmit();
    }, {capture: true});

    list.addEventListener("dblclick", e => {
        if ((e.target as HTMLInputElement).name === "title")
            (e.target as HTMLInputElement).removeAttribute("readonly");
    }, {capture: true});

    list.addEventListener("blur", e => {
        if ((e.target as HTMLInputElement).name === "title")
            (e.target as HTMLInputElement).setAttribute("readonly", "");
    }, {capture: true});

    list.addEventListener("submit", e => {
        const form = e.target as HTMLFormElement;
        const title = form.elements.namedItem("title")! as HTMLInputElement;
        title.blur();
        title.setAttribute("readonly", "");
    }, {capture: true});

    window.document.querySelector("#toggleAll")!.addEventListener("change", ({target}) => {
        (target as HTMLInputElement).form!.requestSubmit();
    })
}

export function selectRoot(doc: Document) { return doc.querySelector(".todoapp"); }
