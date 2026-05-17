import { Hono } from "hono";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

// POST /ai/classify — heuristic quadrant assignment
app.post("/classify", (c) => {
  const userId = c.get("userId") as string;
  const today = new Date().toISOString().slice(0, 10);

  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = :uid AND completed = 0 AND quadrant = 'unclassified'").all({ uid: userId }) as any[];

  const suggestions: Array<{ task_id: string; quadrant: string; confidence: number }> = [];

  for (const task of tasks) {
    let q = "Q3";
    let confidence = 0.6;

    if (task.due && task.due <= today) {
      q = "Q1"; confidence = 0.85;
    } else if (task.due) {
      const daysUntil = Math.ceil((new Date(task.due).getTime() - Date.now()) / 86400000);
      if (daysUntil <= 7) { q = "Q2"; confidence = 0.75; }
      else { q = "Q3"; confidence = 0.65; }
    } else if (task.duration <= 15) {
      q = "Q4"; confidence = 0.6;
    }

    db.prepare("UPDATE tasks SET ai_suggest = :q, updated_at = :now WHERE id = :id")
      .run({ q, now: new Date().toISOString(), id: task.id });

    suggestions.push({ task_id: task.id, quadrant: q, confidence });
  }

  return c.json({ suggestions });
});

// POST /ai/recommend — return highest-priority Q1 today task
app.post("/recommend", (c) => {
  const userId = c.get("userId") as string;

  const task = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = :uid AND completed = 0 AND quadrant = 'Q1' AND today = 1
    ORDER BY conviction DESC NULLS LAST, due ASC NULLS LAST
    LIMIT 1
  `).get({ uid: userId }) as any;

  if (!task) return c.json({ task: null });

  const conviction = 0.85;
  db.prepare("UPDATE tasks SET conviction = :c, updated_at = :now WHERE id = :id")
    .run({ c: conviction, now: new Date().toISOString(), id: task.id });

  return c.json({
    task: {
      id: task.id,
      title: { en: task.title_en, ...(task.title_zh ? { zh: task.title_zh } : {}) },
      quadrant: task.quadrant,
      conviction,
    },
  });
});

// POST /ai/parse — stub: return empty task scaffold
app.post("/parse", (c) => {
  return c.json({
    task: {
      title: { en: "" },
      quadrant: "unclassified",
      today: false,
      due: null,
      duration: 0,
      pomos_total: 0,
    },
    confidence: 0,
  });
});

export default app;
