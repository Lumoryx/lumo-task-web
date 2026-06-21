/**
 * Standards · Contract-First enforcement (static scan)
 *
 * Turns the CLAUDE.md "Contract-First" rule into an executable guard. For every
 * domain that has been migrated into @lumo/contracts, the route file must NOT
 * define its request/response body shape inline — it must import the schema
 * from the contract. We forbid the specific anti-pattern of passing an inline
 * object literal as the JSON body validator:  zValidator("json", z.object({…})).
 *
 * Path-param coercion (`zValidator("param", z.object({ id: … }))`) is allowed —
 * it is not an API request/response shape.
 *
 * To migrate a new domain: move its body schema into @lumo/contracts and add
 * the route file to MIGRATED_ROUTES below.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const routesDir = resolve(here, "../../routes");

const MIGRATED_ROUTES = ["tasks.ts", "people.ts"];

// Inline object schema used as a JSON body validator — the forbidden pattern.
const INLINE_JSON_BODY = /zValidator\(\s*["']json["']\s*,\s*z\.object\s*\(/;

describe("Standards · Contract-First (migrated routes use @lumo/contracts)", () => {
  for (const file of MIGRATED_ROUTES) {
    test(`${file} does not define an inline JSON body schema`, () => {
      const src = readFileSync(resolve(routesDir, file), "utf8");
      assert.equal(
        INLINE_JSON_BODY.test(src),
        false,
        `${file} passes an inline z.object() as a JSON body validator — move the shape into @lumo/contracts`,
      );
    });

    test(`${file} imports from @lumo/contracts`, () => {
      const src = readFileSync(resolve(routesDir, file), "utf8");
      assert.ok(
        /from\s+["']@lumo\/contracts["']/.test(src),
        `${file} must import its request/response schema from @lumo/contracts`,
      );
    });
  }
});
