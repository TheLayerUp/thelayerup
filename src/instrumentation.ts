import type { Instrumentation } from "next";

export async function register() {
  // Only validate the running server, not the build.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { validateEnv } = await import("./server/env");
    validateEnv();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  // Structured log line — searchable in Vercel/host logs. Swap for Sentry etc. later.
  const e = err as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      message: e?.message,
      digest: e?.digest,
      path: request.path,
      method: request.method,
      route: context.routePath,
      kind: context.routeType,
    })
  );
};
