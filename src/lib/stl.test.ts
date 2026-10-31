import { describe, expect, it } from "vitest";
import { parseStl } from "./stl";
import { estimate, quoteMaterials } from "@/config/quote";

// A 10 mm cube = 12 triangles, outward-facing.
const cubeTris: number[][][] = (() => {
  const s = 10;
  const v = (x: number, y: number, z: number) => [x * s, y * s, z * s];
  const quads = [
    [v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0)],
    [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)],
    [v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)],
    [v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0)],
    [v(0, 0, 0), v(0, 0, 1), v(0, 1, 1), v(0, 1, 0)],
    [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)],
  ];
  return quads.flatMap(([a, b, c, d]) => [
    [a, b, c],
    [a, c, d],
  ]);
})();

function binaryStl(tris: number[][][]) {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const view = new DataView(buf);
  view.setUint32(80, tris.length, true);
  tris.forEach((t, i) => {
    const o = 84 + i * 50 + 12;
    t.forEach((p, k) => p.forEach((n, j) => view.setFloat32(o + k * 12 + j * 4, n, true)));
  });
  return buf;
}

function asciiStl(tris: number[][][]) {
  const body = tris
    .map(
      (t) => `facet normal 0 0 0\nouter loop\n${t.map((p) => `vertex ${p.join(" ")}`).join("\n")}\nendloop\nendfacet`
    )
    .join("\n");
  return new TextEncoder().encode(`solid cube\n${body}\nendsolid cube`).buffer as ArrayBuffer;
}

describe("parseStl", () => {
  it("reads a binary cube", () => {
    const m = parseStl(binaryStl(cubeTris));
    expect(m.triangles).toBe(12);
    expect(m.volumeCm3).toBeCloseTo(1, 5);
    expect(m.size).toEqual({ x: 10, y: 10, z: 10 });
  });

  it("reads an ASCII cube", () => {
    expect(parseStl(asciiStl(cubeTris)).volumeCm3).toBeCloseTo(1, 5);
  });

  it("rejects non-STL data", () => {
    expect(() =>
      parseStl(new TextEncoder().encode("hello world, not a mesh at all".repeat(4)).buffer as ArrayBuffer)
    ).toThrow();
  });
});

describe("estimate", () => {
  it("never goes below the minimum price and rounds to ₹10", () => {
    const e = estimate(1, quoteMaterials[0]);
    expect(e.price).toBe(199);
    const big = estimate(500, quoteMaterials[0]);
    expect(big.price % 10).toBe(0);
    expect(big.grams).toBe(Math.round(500 * 1.24 * 0.38));
  });
});
