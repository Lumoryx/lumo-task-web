import { describe, it, expect } from "vitest";
import { STRINGS } from "../strings";

describe("i18n strings", () => {
  const enKeys = Object.keys(STRINGS.en);
  const zhKeys = Object.keys(STRINGS.zh);

  it("every en key also exists in zh", () => {
    const missing = enKeys.filter((k) => !STRINGS.zh[k]);
    expect(missing).toEqual([]);
  });

  it("every zh key also exists in en", () => {
    const missing = zhKeys.filter((k) => !STRINGS.en[k]);
    expect(missing).toEqual([]);
  });

  it("no key has an empty string value in en", () => {
    const empty = enKeys.filter((k) => STRINGS.en[k].trim() === "");
    expect(empty).toEqual([]);
  });

  it("has ai.chat.basicMode in both locales", () => {
    expect(STRINGS.en["ai.chat.basicMode"]).toBeTruthy();
    expect(STRINGS.zh["ai.chat.basicMode"]).toBeTruthy();
  });

  it("has pet.chat.empty in both locales", () => {
    expect(STRINGS.en["pet.chat.empty"]).toBeTruthy();
    expect(STRINGS.zh["pet.chat.empty"]).toBeTruthy();
  });
});
