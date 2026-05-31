import { serve } from "@hono/node-server";
import { runMigrations, ensureDefaultUser } from "./db/migrate.js";
import { app } from "./app.js";

const port = parseInt(process.env.LUMO_PORT ?? "47291");

// Run migrations before accepting requests
runMigrations()
  .then(() => ensureDefaultUser())
  .then(() => {
    console.log(`Lumo backend starting on port ${port}`);
    serve({ fetch: app.fetch, port });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
