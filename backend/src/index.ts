import { serve } from "@hono/node-server";
import { runMigrations, ensureDefaultUser } from "./db/migrate.js";
import { app } from "./app.js";

runMigrations();
ensureDefaultUser();

const port = parseInt(process.env.LUMO_PORT ?? "47291");

console.log(`Lumo backend starting on port ${port}`);
serve({ fetch: app.fetch, port });
