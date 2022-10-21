
import {mapModelToListView, templateView, arrayModel} from "../../src/list";
import {H0Navigator} from "../../src/h0";

interface Task {
    id: string;
    title: string;
    completed: boolean;
}

interface Model {
    tasks: Task[]
}

export async function render(response: Response, root: Element) {
    const {tasks} = (await response.json()) as Model;
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    root.querySelector("#activeCount")!.innerHTML = `${active.length} task${active.length === 1 ? "" : "s"} remaining`;
    const list = root.querySelector(".todo-list")!;
    mapModelToListView<Task>({
        model: arrayModel(location.hash === "#/completed" ? completed : location.hash === "#/active" ? active : tasks, "id"),
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

export async function route(request: Request) : Promise<Response> {
    const fromStorage = (typeof localStorage === "undefined") ? [] : JSON.parse(localStorage.getItem("todos") || "[]");
    const tasks = new Map<string, Task>(fromStorage);
    const save = () => localStorage.setItem("todos", JSON.stringify(Array.from(tasks.entries())));
    const url = new URL(request.url);

    switch (request.method) {
        case "POST": {
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
            return Response.redirect("/todos");
        }

        default:
            return new Response(JSON.stringify({tasks: Array.from(tasks.values())}), {headers: {"Content-Type": "application/json"}});
        }
}

export function mount(root: HTMLElement, {window, h0}: {window: Window, h0: H0Navigator}) {
    window.addEventListener("hashchange", () => h0.reload());
    const list = root.querySelector(".todo-list") as HTMLUListElement;
    list.addEventListener("change", e => {
        if (e.target?.name === "completed")
            h0.submit((e.target as HTMLInputElement).form!);
    }, {capture: true});
    list.addEventListener("dblclick", e => {
        if (e.target?.name === "title")
            (e.target as HTMLInputElement).removeAttribute("readonly");
    }, {capture: true});
    list.addEventListener("blur", e => {
        if (e.target?.name === "title")
            (e.target as HTMLInputElement).setAttribute("readonly", "");
    }, {capture: true});
    window.document.querySelector("#toggleAll")!.addEventListener("change", ({target}) => {
        h0.submit((target as HTMLInputElement).form!);
    })
}

export function selectRoot(doc: Document) { return doc.querySelector(".todoapp"); }
export const scope = "/todos";
export const options = {
    updates: "client"
}