import { describe, expect, it } from "vitest";
import { returnWindowOpen } from "./returns";

describe("returnWindowOpen", () => {
  const delivered = new Date("2026-10-01T10:00:00Z");
  it("is open within 48 hours of delivery", () => {
    expect(returnWindowOpen(delivered, new Date("2026-10-03T09:59:00Z"))).toBe(true);
  });
  it("closes after 48 hours", () => {
    expect(returnWindowOpen(delivered, new Date("2026-10-03T10:01:00Z"))).toBe(false);
  });
});
