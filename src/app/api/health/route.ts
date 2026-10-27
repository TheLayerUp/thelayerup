import { connection } from "next/server";
import { prisma } from "@/server/db";

/**
 * Uptime check for monitors (Better Stack, UptimeRobot). Returns 200 when the
 * app can reach the database, 503 otherwise. Reveals nothing else.
 */
export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(
      JSON.stringify({ level: "error", message: "health check: database unreachable", error: String(err) })
    );
    return Response.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
