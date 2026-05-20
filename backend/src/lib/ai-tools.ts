import type { ToolDefinition, ToolCall } from "./ai-client.js";

// ── Tool definitions ──────────────────────────────────────────────────────────

export const TASK_TOOLS: ToolDefinition[] = [
  {
    name: "list_tasks",
    description: "List the user's active tasks. Call this first before update/complete/delete to find the correct task ID.",
    parameters: {
      type: "object",
      properties: {
        quadrant: {
          type: "string",
          description: "Filter by quadrant",
          enum: ["Q1", "Q2", "Q3", "Q4", "unclassified"],
        },
        today_only: {
          type: "string",
          description: "Pass 'true' to return only tasks in today's plan",
          enum: ["true", "false"],
        },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a new task for the user. Infer the quadrant from context: Q1=urgent+important, Q2=not urgent+important, Q3=urgent+not important, Q4=not urgent+not important.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title (in the user's language)" },
        quadrant: {
          type: "string",
          description: "Eisenhower quadrant",
          enum: ["Q1", "Q2", "Q3", "Q4", "unclassified"],
        },
        today: {
          type: "string",
          description: "Pass 'true' to add to today's plan",
          enum: ["true", "false"],
        },
        due: { type: "string", description: "Due date in YYYY-MM-DD format (optional)" },
        duration: { type: "string", description: "Estimated duration in minutes as a number string (optional)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update fields of an existing task. Use list_tasks first to find the task ID.",
    parameters: {
      type: "object",
      properties: {
        id:       { type: "string", description: "Task ID (from list_tasks)" },
        title:    { type: "string", description: "New title" },
        quadrant: { type: "string", description: "New quadrant", enum: ["Q1", "Q2", "Q3", "Q4", "unclassified"] },
        today:    { type: "string", description: "'true' to add to today, 'false' to remove", enum: ["true", "false"] },
        due:      { type: "string", description: "New due date YYYY-MM-DD, or empty to clear" },
        duration: { type: "string", description: "New estimated duration in minutes as a number string" },
      },
      required: ["id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed and record it in the completion history.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID to complete (from list_tasks)" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Permanently delete a task. Use only when the user explicitly asks to delete or remove a task.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID to delete (from list_tasks)" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_people",
    description: "List team members who can be assigned to tasks.",
    parameters: { type: "object", properties: {} },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

const PORT = process.env.LUMO_PORT ?? "47291";

export async function executeTool(
  tool: ToolCall,
  jwt: string,
  locale: string,
): Promise<string> {
  const base = `http://127.0.0.1:${PORT}/v1`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  async function api(method: string, path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data: unknown;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
    return data;
  }

  const a = tool.args;

  switch (tool.name) {
    case "list_tasks": {
      const tasks = await api("GET", "/tasks") as any[];
      let filtered: any[] = tasks;
      if (a.quadrant) filtered = filtered.filter((t) => t.quadrant === a.quadrant);
      if (a.today_only === "true") filtered = filtered.filter((t) => t.today);
      const summary = filtered.map((t) => ({
        id: t.id,
        title: t.title?.[locale] ?? t.title?.en ?? t.title,
        quadrant: t.quadrant,
        today: t.today,
        due: t.due,
      }));
      return JSON.stringify(summary);
    }

    case "create_task": {
      const body: any = {
        title: { en: String(a.title), ...(locale === "zh" ? { zh: String(a.title) } : {}) },
        quadrant: (a.quadrant as string) || "unclassified",
        today: a.today === "true",
        ...(a.due ? { due: String(a.due) } : {}),
        ...(a.duration ? { duration: parseInt(String(a.duration), 10) || 0 } : {}),
      };
      const result = await api("POST", "/tasks", body) as any;
      return JSON.stringify({
        created: true,
        id: result.id,
        title: result.title?.en ?? String(a.title),
      });
    }

    case "update_task": {
      const patch: any = {};
      if (a.title)    patch.title = { en: String(a.title), ...(locale === "zh" ? { zh: String(a.title) } : {}) };
      if (a.quadrant) patch.quadrant = a.quadrant;
      if (a.today !== undefined) patch.today = a.today === "true";
      if (a.due !== undefined)  patch.due = a.due || null;
      if (a.duration) patch.duration = parseInt(String(a.duration), 10) || 0;
      const result = await api("PATCH", `/tasks/${a.id}`, patch) as any;
      return JSON.stringify({ updated: true, id: result.id });
    }

    case "complete_task": {
      await api("POST", `/tasks/${a.id}/complete`, {});
      return JSON.stringify({ completed: true, id: a.id });
    }

    case "delete_task": {
      await api("DELETE", `/tasks/${a.id}`);
      return JSON.stringify({ deleted: true, id: a.id });
    }

    case "list_people": {
      const people = await api("GET", "/people") as any[];
      return JSON.stringify(people.map((p) => ({ id: p.id, name: p.name, initials: p.initials })));
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${tool.name}` });
  }
}
