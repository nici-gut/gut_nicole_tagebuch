// main.ts

import { Application, Router } from "oak";
// Wir importieren unsere neuen Deno KV Funktionen
import { getEntries, createEntry, updateEntry, deleteEntry } from "./entry.ts"; // Umbenannt
import { createJWT, verifyJWT } from "./auth.ts";

const app = new Application();
const router = new Router();

// CORS und OPTIONS Middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

// Auth Middleware
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/entries")) { // Geändert zu /entries
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

// GET /entries → alle anzeigen
router.get("/entries", async (ctx) => {
  const entries = await getEntries();
  ctx.response.body = entries;
});

// POST /entries → neuer Eintrag
router.post("/entries", async (ctx) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const newEntry = await createEntry(body.title, body.content);
  ctx.response.body = newEntry;
});

// PUT /entries/:id → Eintrag aktualisieren
router.put("/entries/:id", async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.request.body({ type: "json" }).value;
  const entry = await updateEntry(id, body.title, body.content);
  if (entry) {
    ctx.response.body = entry;
  } else {
    ctx.response.status = 404;
    ctx.response.body = { error: "Eintrag nicht gefunden" };
  }
});

// DELETE /entries/:id → Eintrag löschen
router.delete("/entries/:id", async (ctx) => {
  const { id } = ctx.params;
  await deleteEntry(id);
  ctx.response.body = { success: true };
});

// Login
router.post("/login", async (ctx) => {
  const { username, password } = await ctx.request.body({ type: "json" })
    .value;
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

// HTTP Server starten
console.log("Server läuft auf http://localhost:8000");
await app.listen({ port: 8000 });


/* HTTPS Server starten 

console.log("Server läuft auf https://localhost:8000"); 
await app.listen({
  port: 8000,
  cert: await Deno.readTextFile("./localhost.pem"),
  key: await Deno.readTextFile("./localhost-key.pem"),
});
*/