import { searchSuggestions } from "@/server/queries/catalog";

/** Type-ahead for the navbar search box. Reads only public catalogue data. */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return Response.json({ results: [] });

  const results = await searchSuggestions(q);
  return Response.json({ results }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
