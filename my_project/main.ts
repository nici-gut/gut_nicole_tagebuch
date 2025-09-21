import { Application, Router } from "oak";
import { Todo, readTodos, writeTodos } from "./todo.ts";
import { createJWT, verifyJWT } from "./auth.ts";

const app = new Application();
const router = new Router();

app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/todos")) {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token fehlt" }; // ← wichtig!
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyJWT(token);

    if (!payload) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token ungültig" }; // ← wichtig!
      return;
    }

    ctx.state.user = payload;
  }

  await next();
});

// Logging
app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});

// Statische Dateien (Frontend) ausliefern
app.use(async (ctx, next) => {
  try {
    // Versuche, die angeforderte Datei aus dem aktuellen Verzeichnis zu senden.
    // Wenn der Pfad "/" ist, wird automatisch nach "index.html" gesucht.
    await ctx.send({
      root: `${Deno.cwd()}/`,
      index: "index.html",
    });
  } catch {
    // Wenn die Datei nicht gefunden wird, übergebe die Anfrage an die nächste Middleware (deine API-Routen).
    await next();
  }
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

// POST /login → Benutzer-Login
router.post("/login", async (ctx) => {
  const { username, password } = await ctx.request.body({ type: "json" }).value;
  // Dummy-Check: Nutzername und Passwort sind fest im Code!
  if (username === "admin" && password === "passwort") {
    const token = await createJWT({ username });
    ctx.response.body = { token };
  } else {
    ctx.response.status = 401;
    ctx.response.body = { error: "Ungültige Zugangsdaten" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server läuft auf http://localhost:8000");
await app.listen({ port: 8000 });
