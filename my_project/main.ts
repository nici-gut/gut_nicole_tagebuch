import { Application, Router } from "oak";
// Wir importieren unsere neuen Deno KV Funktionen
import { getTodos, createTodo, updateTodo, deleteTodo } from "./todo.ts";
import { createJWT, verifyJWT } from "./auth.ts";

const app = new Application();
const router = new Router();

// CORS und OPTIONS Middleware 
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

// Auth Middleware 
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/todos")) {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token fehlt" };
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyJWT(token);

    if (!payload) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token ungültig" };
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

// Statische Dateien ausliefern 
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});


// GET /todos → alle anzeigen
router.get("/todos", async (ctx) => {
  const todos = await getTodos(); 
  ctx.response.body = todos;
});

// POST /todos → neues ToDo
router.post("/todos", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const newTodo = await createTodo(body.title); 
  ctx.response.body = newTodo;
});

// PUT /todos/:id → ToDo erledigt/unerledigt schalten
router.put("/todos/:id", async (ctx) => {
  const { id } = ctx.params; 
  const todo = await updateTodo(id); 
  if (todo) {
    ctx.response.body = todo;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Todo nicht gefunden" };
  }
});

// DELETE /todos/:id → ToDo löschen
router.delete("/todos/:id", async (ctx) => {
  const { id } = ctx.params; 
  await deleteTodo(id); 
  ctx.response.body = { success: true };
});

// Login 
router.post("/login", async (ctx) => {
  const { username, password } = await ctx.request.body({ type: "json" }).value;
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

console.log("Server läuft auf https://localhost:8000"); 
await app.listen({
  port: 8000,
  cert: await Deno.readTextFile("./localhost.pem"),
  key: await Deno.readTextFile("./localhost-key.pem"),
});