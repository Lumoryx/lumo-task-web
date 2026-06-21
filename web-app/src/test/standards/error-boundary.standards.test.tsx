/**
 * Standards · ErrorBoundary at the app root
 *
 * CLAUDE.md: "Wrap the app root in ErrorBoundary — never let a render error
 * produce a blank screen." This guard asserts App.tsx still imports
 * ErrorBoundary and that it wraps the <Routes> tree, so a refactor can't
 * silently drop the safety net.
 *
 * Pairs with components/__tests__/ErrorBoundary.test.tsx, which verifies the
 * boundary's runtime behavior (fallback UI on a thrown child).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(resolve(here, "../../App.tsx"), "utf8");

describe("Standards · app root is wrapped in ErrorBoundary", () => {
  it("App.tsx imports ErrorBoundary", () => {
    expect(/import\s+\{[^}]*\bErrorBoundary\b[^}]*\}\s+from/.test(appSource)).toBe(true);
  });

  it("ErrorBoundary wraps the Routes tree", () => {
    const openBoundary = appSource.indexOf("<ErrorBoundary>");
    const routes = appSource.indexOf("<Routes>");
    const closeBoundary = appSource.indexOf("</ErrorBoundary>");
    expect(openBoundary).toBeGreaterThanOrEqual(0);
    expect(routes).toBeGreaterThan(openBoundary);
    expect(closeBoundary).toBeGreaterThan(routes);
  });
});
