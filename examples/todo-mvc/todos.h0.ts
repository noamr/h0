import {createListUpdater} from "../../src/list";
import {H0Navigator} from "../../src/h0";

interface Task {
    id: string;
    title: string;
    completed: boolean;
}

interface Model {
    tasks: Task[]
}

const updateTaskList = createListUpdater<Task, HTMLFormElement, HTMLUListElement>({
    keyAttribute: "data-id",
    itemTagName: "li",
    modelSchema: (v: Task) => v.id,
    updateItem: (element: HTMLFormElement, task: Task) => {
        if (task.completed)
            element.querySelector('input[name="completed"]')!.setAttribute("checked", "checked");
        else
            element.querySelector('input[name="completed"]')!.removeAttribute("checked");

        element.querySelector("input[name=title]")!.setAttribute("value", task.title);
        element.querySelector("input[name=id]")!.setAttribute("value", task.id);
    },
    createItem: document.querySelector(".item-template") as HTMLTemplateElement
})

export async function render(response: Response, root: HTMLElement) {
    const {tasks} = (await response.json()) as Model;
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    root.querySelector("#activeCount")!.innerHTML = "" + active.length;
    console.log(location.hash);
    const list = root.querySelector(".todo-list") as HTMLUListElement;
    updateTaskList(list, location.hash === "#/completed" ? completed : location.hash === "#/active" ? active : tasks);
}

export async function route(request: Request) : Promise<Response> {
    const fromStorage = (typeof localStorage === "undefined") ? [] : JSON.parse(localStorage.getItem("todos") || "[]");
    const tasks = new Map<string, Task>(fromStorage);
    const save = () => localStorage.setItem("todos", JSON.stringify(Array.from(tasks.entries())));

    switch (request.method) {
        case "POST": {
            const id = crypto.randomUUID();
            const data = await request.formData();
            const title = data.get("title");
            if (title)
                tasks.set(id, {id, title: title as string, completed: false});
            debugger;
            save();
            break;
        }

        case "PUT": {
            const data = await request.formData();
            const id = data.get("id") as string;
            const title = data.get("title");
            if (title) {
                const task: Task = {id, title: title as string, completed: !!data.get("completed")};
                tasks.set(id, task);
            } else
                tasks.delete(id);

            save();
            break;
        }

        case "DELETE": {
            const data = await request.formData();
            const id = data.get("id") as string;
            tasks.delete(id);
            save();
            break;
        }
    }
    return new Response(JSON.stringify({tasks: Array.from(tasks.values())}), {headers: {"Content-Type": "application/json"}});
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
}

export function selectRoot(doc: Document) { return doc.querySelector(".todoapp"); }
export const scope = "/todos";
export const options = {
    updates: "client"
}