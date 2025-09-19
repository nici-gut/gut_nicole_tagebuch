export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// JSON lesen/schreiben
export async function readTodos(): Promise<Todo[]> {
  try {
    const data = await Deno.readTextFile("db.json");
    console.log("db.json Inhalt:", data); // <--- Logging hinzugefügt
    return JSON.parse(data);
  } catch (e) {
    console.error("Fehler beim Lesen von db.json:", e);
    return [];
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  await Deno.writeTextFile("db.json", JSON.stringify(todos, null, 2));
}
