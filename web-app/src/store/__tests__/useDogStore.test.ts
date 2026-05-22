import { describe, it, expect, beforeEach } from "vitest";
import { useDogStore, getLevelFromXP, getTierFromLevel, getTierName } from "../useDogStore";

beforeEach(() => {
  useDogStore.setState({
    xp: 0,
    level: 1,
    initialized: false,
    pendingLevelUp: null,
  });
});

describe("getLevelFromXP", () => {
  it("returns 1 at 0 XP", () => expect(getLevelFromXP(0)).toBe(1));
  it("returns 2 at 100 XP", () => expect(getLevelFromXP(100)).toBe(2));
  it("returns 16 at 1500 XP", () => expect(getLevelFromXP(1500)).toBe(16));
  it("never returns less than 1 for negative input", () => expect(getLevelFromXP(-50)).toBe(1));
});

describe("getTierFromLevel", () => {
  it("puppy for levels 1–15", () => {
    expect(getTierFromLevel(1)).toBe("puppy");
    expect(getTierFromLevel(15)).toBe("puppy");
  });
  it("adult for levels 16–30", () => {
    expect(getTierFromLevel(16)).toBe("adult");
    expect(getTierFromLevel(30)).toBe("adult");
  });
  it("wise for levels 31–45", () => {
    expect(getTierFromLevel(31)).toBe("wise");
    expect(getTierFromLevel(45)).toBe("wise");
  });
  it("legendary for level 46+", () => {
    expect(getTierFromLevel(46)).toBe("legendary");
    expect(getTierFromLevel(100)).toBe("legendary");
  });
});

describe("getTierName", () => {
  it("returns English tier names", () => {
    expect(getTierName("puppy", "en")).toBe("Puppy");
    expect(getTierName("adult", "en")).toBe("Adult");
    expect(getTierName("wise", "en")).toBe("Wise");
    expect(getTierName("legendary", "en")).toBe("Legendary");
  });
  it("returns Chinese tier names", () => {
    expect(getTierName("puppy", "zh")).toBe("幼犬");
    expect(getTierName("wise", "zh")).toBe("智慧犬");
    expect(getTierName("legendary", "zh")).toBe("传奇");
  });
});

describe("addXP", () => {
  it("increments xp correctly", () => {
    useDogStore.getState().addXP(10);
    expect(useDogStore.getState().xp).toBe(10);
  });

  it("accumulates multiple addXP calls", () => {
    useDogStore.getState().addXP(30);
    useDogStore.getState().addXP(20);
    expect(useDogStore.getState().xp).toBe(50);
  });

  it("updates level when threshold is crossed", () => {
    useDogStore.getState().addXP(100);
    expect(useDogStore.getState().level).toBe(2);
  });

  it("sets pendingLevelUp when leveling up", () => {
    useDogStore.getState().addXP(100);
    expect(useDogStore.getState().pendingLevelUp).toBe(2);
  });

  it("does not set pendingLevelUp without a level change", () => {
    useDogStore.getState().addXP(50);
    expect(useDogStore.getState().pendingLevelUp).toBeNull();
  });

  it("transitions to adult tier at level 16", () => {
    useDogStore.setState({ xp: 1490, level: 15, initialized: true, pendingLevelUp: null });
    useDogStore.getState().addXP(20); // 1510 XP → level 16
    expect(useDogStore.getState().level).toBe(16);
    expect(useDogStore.getState().pendingLevelUp).toBe(16);
  });
});

describe("clearPendingLevelUp", () => {
  it("resets pendingLevelUp to null", () => {
    useDogStore.setState({ pendingLevelUp: 3 });
    useDogStore.getState().clearPendingLevelUp();
    expect(useDogStore.getState().pendingLevelUp).toBeNull();
  });
});

describe("initFromStats", () => {
  it("initializes xp from tasks and focus minutes", () => {
    useDogStore.getState().initFromStats(5, 50);
    expect(useDogStore.getState().xp).toBe(100); // 5*10 + 50
    expect(useDogStore.getState().level).toBe(2);
    expect(useDogStore.getState().initialized).toBe(true);
  });

  it("does not overwrite if already initialized", () => {
    useDogStore.getState().initFromStats(5, 50);
    useDogStore.getState().initFromStats(100, 1000);
    expect(useDogStore.getState().xp).toBe(100);
  });

  it("sets level 1 when stats are zero", () => {
    useDogStore.getState().initFromStats(0, 0);
    expect(useDogStore.getState().level).toBe(1);
    expect(useDogStore.getState().initialized).toBe(true);
  });
});
