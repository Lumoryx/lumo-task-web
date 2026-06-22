/**
 * In-process HTTP client for backend tests.
 *
 * Drives the Hono `app` directly via `app.request()` — no socket, no port.
 * Every API/security/standards test goes through this single helper so the
 * request/response contract (auth header, JSON encoding, error parsing) lives
 * in exactly one place. Returns `{ status, body, headers }`; `body` is parsed
 * as JSON when possible, otherwise the raw text.
 *
 * (Lifted verbatim from the original api.test.ts `req()` — zero behavior change,
 * plus `headers` is now surfaced for the security suite.)
 */
import { app } from "../../app.js";

export interface ApiResponse {
  status: number;
  body: any;
  headers: Headers;
}

export interface RequestOptions {
  body?: unknown;
  token?: string;
  /** Extra/override headers — used by the security suite to send raw tokens. */
  headers?: Record<string, string>;
}

export async function req(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  Object.assign(headers, options.headers ?? {});

  const res = await app.request(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status, body, headers: res.headers };
}
