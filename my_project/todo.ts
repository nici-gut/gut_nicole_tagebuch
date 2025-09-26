// Öffne die Deno KV Datenbank.
const kv = await Deno.openKv();

export interface Todo {
  id: string; 
  title: string;
  done: boolean;
}

// Alle To-Dos aus der KV-Datenbank auslesen
export async function getTodos(): Promise<Todo[]> {
  const todos: Todo[] = [];
  // kv.list holt alle Einträge, die mit dem Präfix ["todos"] beginnen
  for await (const entry of kv.list<Todo>({ prefix: ["todos"] })) {
    todos.push(entry.value);
  }
  return todos;
}

// Ein neues To-Do erstellen
export async function createTodo(title: string): Promise<Todo> {
  const newTodo: Todo = {
    id: crypto.randomUUID(), // Erzeugt eine einzigartige ID
    title,
    done: false,
  };
  // Speichert das To-Do unter einem eindeutigen Schlüssel
  await kv.set(["todos", newTodo.id], newTodo);
  return newTodo;
}

// Ein To-Do aktualisieren (z.B. den "done"-Status ändern)
export async function updateTodo(id: string): Promise<Todo | null> {
  const key = ["todos", id];
  const todoEntry = await kv.get<Todo>(key);

  if (!todoEntry.value) {
    return null;
  }

  const updatedTodo = { ...todoEntry.value, done: !todoEntry.value.done };
  await kv.set(key, updatedTodo);
  return updatedTodo;
}

// Ein To-Do löschen
export async function deleteTodo(id: string): Promise<void> {
  await kv.delete(["todos", id]);
}