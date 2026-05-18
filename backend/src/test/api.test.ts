import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { runMigrations, ensureDefaultUser } from "../db/migrate.js";
import { app } from "../app.js";

// Bootstrap in-memory DB once before all tests
before(() => {
  runMigrations();
  ensureDefaultUser();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function req(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {}
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await app.request(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

let authToken = "";
let userId = "";
let taskId = "";
let personId = "";

// ── Health ────────────────────────────────────────────────────────────────────

describe("health", () => {
  test("GET /health → 200 ok:true", async () => {
    const { status, body } = await req("GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("auth", () => {
  test("POST /v1/auth/register → 201 with token", async () => {
    const { status, body } = await req("POST", "/v1/auth/register", {
      body: { email: "test_user@example.com", password: "password123", name: "Test User" },
    });
    assert.equal(status, 201);
    assert.ok(body.token, "should return a token");
    assert.equal(body.user.email, "test_user@example.com");
  });

  test("POST /v1/auth/register duplicate email → 409", async () => {
    const { status } = await req("POST", "/v1/auth/register", {
      body: { email: "test_user@example.com", password: "password123", name: "Test User" },
    });
    assert.equal(status, 409);
  });

  test("POST /v1/auth/signin with demo credentials → 200 with token", async () => {
    const { status, body } = await req("POST", "/v1/auth/signin", {
      body: { email: "alex@stride.studio", password: "demo1234" },
    });
    assert.equal(status, 200);
    assert.ok(body.token, "should return a token");
    assert.equal(body.user.email, "alex@stride.studio");
    authToken = body.token;
    userId = body.user.id;
  });

  test("POST /v1/auth/signin wrong password → 401", async () => {
    const { status } = await req("POST", "/v1/auth/signin", {
      body: { email: "alex@stride.studio", password: "wrongpassword" },
    });
    assert.equal(status, 401);
  });

  test("POST /v1/auth/signin unknown email → 401", async () => {
    const { status } = await req("POST", "/v1/auth/signin", {
      body: { email: "nobody@example.com", password: "password123" },
    });
    assert.equal(status, 401);
  });

  test("POST /v1/auth/change-password → 200", async () => {
    // Sign in with new test account for password change
    const { body: signinBody } = await req("POST", "/v1/auth/signin", {
      body: { email: "test_user@example.com", password: "password123" },
    });
    const token = signinBody.token;

    const { status } = await req("POST", "/v1/auth/change-password", {
      token,
      body: { current_password: "password123", new_password: "newpassword456" },
    });
    assert.equal(status, 200);

    // Verify old password no longer works
    const { status: oldStatus } = await req("POST", "/v1/auth/signin", {
      body: { email: "test_user@example.com", password: "password123" },
    });
    assert.equal(oldStatus, 401);

    // Verify new password works
    const { status: newStatus } = await req("POST", "/v1/auth/signin", {
      body: { email: "test_user@example.com", password: "newpassword456" },
    });
    assert.equal(newStatus, 200);
  });

  test("POST /v1/auth/change-password wrong current password → 400", async () => {
    const { status } = await req("POST", "/v1/auth/change-password", {
      token: authToken,
      body: { current_password: "wrongcurrent", new_password: "newpass123" },
    });
    assert.equal(status, 400);
  });

  test("POST /v1/auth/signout → 200", async () => {
    const { status, body } = await req("POST", "/v1/auth/signout", { token: authToken });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  test("protected route without token → 401", async () => {
    const { status } = await req("GET", "/v1/user");
    assert.equal(status, 401);
  });
});

// ── User ──────────────────────────────────────────────────────────────────────

describe("user", () => {
  test("GET /v1/user → 200 with user profile", async () => {
    const { status, body } = await req("GET", "/v1/user", { token: authToken });
    assert.equal(status, 200);
    assert.equal(body.email, "alex@stride.studio");
    assert.equal(body.id, userId);
    assert.ok("stats" in body);
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe("settings", () => {
  test("GET /v1/settings → 200 with default settings", async () => {
    const { status, body } = await req("GET", "/v1/settings", { token: authToken });
    assert.equal(status, 200);
    assert.ok("locale" in body);
    assert.ok("accent" in body);
    assert.ok("pomodoro_duration" in body);
  });

  test("PATCH /v1/settings locale → 200 updated", async () => {
    const { status, body } = await req("PATCH", "/v1/settings", {
      token: authToken,
      body: { locale: "zh" },
    });
    assert.equal(status, 200);
    assert.equal(body.locale, "zh");
  });

  test("PATCH /v1/settings → reverts locale to en", async () => {
    const { status, body } = await req("PATCH", "/v1/settings", {
      token: authToken,
      body: { locale: "en" },
    });
    assert.equal(status, 200);
    assert.equal(body.locale, "en");
  });
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

describe("tasks", () => {
  test("GET /v1/tasks → 200 array", async () => {
    const { status, body } = await req("GET", "/v1/tasks", { token: authToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("POST /v1/tasks → 201 new task", async () => {
    const { status, body } = await req("POST", "/v1/tasks", {
      token: authToken,
      body: {
        title: { en: "Write tests", zh: "写测试" },
        quadrant: "Q1",
        today: true,
        duration: 30,
        pomos_total: 2,
      },
    });
    assert.equal(status, 201);
    assert.equal(body.title.en, "Write tests");
    assert.equal(body.quadrant, "Q1");
    assert.equal(body.today, true);
    taskId = body.id;
  });

  test("GET /v1/tasks/:id → 200 single task", async () => {
    const { status, body } = await req("GET", `/v1/tasks/${taskId}`, { token: authToken });
    assert.equal(status, 200);
    assert.equal(body.id, taskId);
  });

  test("PATCH /v1/tasks/:id → 200 updated task", async () => {
    const { status, body } = await req("PATCH", `/v1/tasks/${taskId}`, {
      token: authToken,
      body: { quadrant: "Q2", today: false },
    });
    assert.equal(status, 200);
    assert.equal(body.quadrant, "Q2");
    assert.equal(body.today, false);
  });

  test("POST /v1/tasks/:id/complete → 200", async () => {
    const { status, body } = await req("POST", `/v1/tasks/${taskId}/complete`, {
      token: authToken,
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  test("completed task no longer in GET /v1/tasks", async () => {
    const { body } = await req("GET", "/v1/tasks", { token: authToken });
    const found = (body as any[]).find((t: any) => t.id === taskId);
    assert.equal(found, undefined);
  });

  test("DELETE /v1/tasks/:id → can delete existing task", async () => {
    // Create a new task to delete
    const { body: newTask } = await req("POST", "/v1/tasks", {
      token: authToken,
      body: { title: { en: "Delete me" }, quadrant: "Q4" },
    });
    const { status } = await req("DELETE", `/v1/tasks/${newTask.id}`, { token: authToken });
    assert.equal(status, 200);
  });

  test("GET /v1/tasks/:id nonexistent → 404", async () => {
    const { status } = await req("GET", "/v1/tasks/nonexistent-id", { token: authToken });
    assert.equal(status, 404);
  });
});

// ── People ────────────────────────────────────────────────────────────────────

describe("people", () => {
  test("GET /v1/people → 200 array", async () => {
    const { status, body } = await req("GET", "/v1/people", { token: authToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("POST /v1/people → 201 new person", async () => {
    const { status, body } = await req("POST", "/v1/people", {
      token: authToken,
      body: { name: "Jane Doe", initials: "JD", color: "#5bc8d4", email: "jane@example.com" },
    });
    assert.equal(status, 201);
    assert.equal(body.name, "Jane Doe");
    personId = body.id;
  });

  test("PATCH /v1/people/:id → 200 updated", async () => {
    const { status, body } = await req("PATCH", `/v1/people/${personId}`, {
      token: authToken,
      body: { name: "Jane Smith" },
    });
    assert.equal(status, 200);
    assert.equal(body.name, "Jane Smith");
  });

  test("DELETE /v1/people/:id → 200", async () => {
    const { status } = await req("DELETE", `/v1/people/${personId}`, { token: authToken });
    assert.equal(status, 200);
  });
});

// ── Completed entries ─────────────────────────────────────────────────────────

describe("completed", () => {
  test("GET /v1/completed → 200 array", async () => {
    const { status, body } = await req("GET", "/v1/completed", { token: authToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("GET /v1/completed?date=today → 200 array", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { status, body } = await req("GET", `/v1/completed?date=${today}`, { token: authToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });
});
