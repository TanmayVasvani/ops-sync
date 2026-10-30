import { describe, expect, it } from "vitest";
import { advance, happensBefore, logWork, merge, replica, syncInto } from "./sync";

describe("sync", () => {
  it("sums quantities logged offline on two phones", () => {
    const a = replica("phone-a");
    const b = replica("phone-b");
    logWork(a, "B-01", "packing", 200);
    logWork(b, "B-01", "packing", 150);
    const m = merge([a, b]);
    expect(m.totals.find((t) => t.batch === "B-01")?.qty).toBe(350);
    expect(m.conflicts).toHaveLength(0);
  });

  it("flags two advances that did not see each other", () => {
    const a = replica("phone-a");
    const b = replica("phone-b");
    advance(a, "B-01", "packing");
    advance(b, "B-01", "done");
    const m = merge([a, b]);
    expect(m.conflicts).toHaveLength(1);
    expect(m.conflicts[0]?.batch).toBe("B-01");
  });

  it("does not flag an advance that happened after a sync", () => {
    const a = replica("phone-a");
    const b = replica("phone-b");
    advance(a, "B-01", "packing");
    syncInto(b, a);
    advance(b, "B-01", "done");
    expect(happensBefore(a.ops[0]?.clock ?? {}, b.ops[1]?.clock ?? {})).toBe(true);
    expect(merge([a, b]).conflicts).toHaveLength(0);
  });
});
