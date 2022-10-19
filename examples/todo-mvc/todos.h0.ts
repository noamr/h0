import {createListUpdater} from "../../src/list";

interface Task {
    id: string;
    title: string;
    completed: boolean;
}

interface Model {
    tasks: Task[]
}

const model: Model = {tasks: []};

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
    updateTaskList(root.querySelector(".todo-list")!, tasks);
}

export async function route(request: Request) : Promise<Response> {
    if (request.method === "POST") {
        console.log(await request.formData());
    }
    return new Response(JSON.stringify(model), {headers: {"Content-Type": "application/json"}});
}

export function selectRoot(doc: Document) { return doc.querySelector(".todoapp"); }
export const scope = "/todos";
export const options = {
    updates: "client"
}