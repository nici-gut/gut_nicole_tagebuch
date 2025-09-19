import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { Todo, readTodos, writeTodos } from "./todo.ts";

const app = new Application();
const router = new Router();

// Logging
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

// GET /todos → alle anzeigen
router.get("/todos", async (ctx) => {
  const todos = await readTodos();
  ctx.response.body = todos;
});

// POST /todos → neues ToDo
router.post("/todos", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const todos = await readTodos();
  const newTodo: Todo = { id: Date.now(), title: body.title, done: false };
  todos.push(newTodo);
  await writeTodos(todos);
  ctx.response.body = newTodo;
});

// PUT /todos/:id → ToDo erledigt/unerledigt schalten
router.put("/todos/:id", async (ctx) => {
  const id = Number(ctx.params.id);
  const todos = await readTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    await writeTodos(todos);
    ctx.response.body = todo;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Todo nicht gefunden" };
  }
});

// DELETE /todos/:id → ToDo löschen
router.delete("/todos/:id", async (ctx) => {
  const id = Number(ctx.params.id);
  let todos = await readTodos();
  todos = todos.filter((t) => t.id !== id);
  await writeTodos(todos);
  ctx.response.body = { success: true };
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server läuft auf http://localhost:8000");
await app.listen({ port: 8000 });



