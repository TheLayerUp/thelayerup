// Minimal STL reader for the instant quote: works on binary and ASCII files,
// entirely in the browser (the file is never uploaded).

export type MeshStats = {
  triangles: number;
  /** Enclosed volume in cm³ (signed-tetrahedron method; needs a closed mesh). */
  volumeCm3: number;
  /** Bounding box in mm. */
  size: { x: number; y: number; z: number };
};

type Vec = [number, number, number];

function accumulate(tris: Iterable<[Vec, Vec, Vec]>): MeshStats {
  let volume = 0;
  let count = 0;
  const min: Vec = [Infinity, Infinity, Infinity];
  const max: Vec = [-Infinity, -Infinity, -Infinity];
  for (const [a, b, c] of tris) {
    count++;
    // Signed volume of the tetrahedron (origin, a, b, c) = a · (b × c) / 6
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
    for (const v of [a, b, c]) {
      for (let k = 0; k < 3; k++) {
        if (v[k] < min[k]) min[k] = v[k];
        if (v[k] > max[k]) max[k] = v[k];
      }
    }
  }
  if (count === 0) throw new Error("This file has no triangles.");
  return {
    triangles: count,
    volumeCm3: Math.abs(volume) / 1000, // mm³ → cm³
    size: { x: max[0] - min[0], y: max[1] - min[1], z: max[2] - min[2] },
  };
}

function* binaryTriangles(view: DataView, count: number): Generator<[Vec, Vec, Vec]> {
  for (let i = 0; i < count; i++) {
    const o = 84 + i * 50 + 12; // skip the 12-byte normal
    const v = (k: number): Vec => [
      view.getFloat32(o + k * 12, true),
      view.getFloat32(o + k * 12 + 4, true),
      view.getFloat32(o + k * 12 + 8, true),
    ];
    yield [v(0), v(1), v(2)];
  }
}

function* asciiTriangles(text: string): Generator<[Vec, Vec, Vec]> {
  const re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g;
  let buf: Vec[] = [];
  for (let m = re.exec(text); m; m = re.exec(text)) {
    buf.push([Number(m[1]), Number(m[2]), Number(m[3])]);
    if (buf.length === 3) {
      yield [buf[0], buf[1], buf[2]];
      buf = [];
    }
  }
}

export function parseStl(data: ArrayBuffer): MeshStats {
  if (data.byteLength < 84) throw new Error("That file is too small to be an STL.");
  const view = new DataView(data);
  const count = view.getUint32(80, true);
  // Binary files have an exact size; anything else is treated as ASCII.
  if (84 + count * 50 === data.byteLength) return accumulate(binaryTriangles(view, count));
  const text = new TextDecoder().decode(data);
  if (!/^\s*solid/i.test(text) || !text.includes("vertex")) throw new Error("That doesn't look like an STL file.");
  return accumulate(asciiTriangles(text));
}
