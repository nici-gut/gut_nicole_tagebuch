export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// JSON lesen/schreiben
export async function readTodos(): Promise<Todo[]> {
  try {
    const data = await Deno.readTextFile("db.json");
    return JSON.parse(data);
  } catch {
    return []; // falls Datei leer oder fehlt
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  await Deno.writeTextFile("db.json", JSON.stringify(todos, null, 2));
}