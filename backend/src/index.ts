import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { runMigrations } from "./db/migrate.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import tasksRoutes from "./routes/tasks.js";
import peopleRoutes from "./routes/people.js";
import completedRoutes from "./routes/completed.js";
import focusRoutes from "./routes/focus.js";
import settingsRoutes from "./routes/settings.js";
import aiRoutes from "./routes/ai.js";

// Run migrations on startup
runMigrations();

const app = new Hono();

app.use(
  "/*",
  cors({
    // Allow the Vite dev server and Electron (file:// sends no Origin header)
    origin: (origin) =>
      !origin || origin === "null" || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")
        ? origin ?? "*"
        : null,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

const v1 = new Hono();
v1.route("/auth", authRoutes);
v1.route("/user", userRoutes);
v1.route("/tasks", tasksRoutes);
v1.route("/people", peopleRoutes);
v1.route("/completed", completedRoutes);
v1.route("/focus", focusRoutes);
v1.route("/settings", settingsRoutes);
v1.route("/ai", aiRoutes);

app.route("/v1", v1);

app.get("/health", (c) => c.json({ ok: true }));

const port = parseInt(process.env.LUMO_PORT ?? "47291");

console.log(`Lumo backend starting on port ${port}`);
serve({ fetch: app.fetch, port });
