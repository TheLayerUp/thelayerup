import "dotenv/config";
import { resetRateLimits } from "./helpers";

/** Clears rate-limit counters so repeated local runs aren't locked out. Never touches remote DBs. */
export default async function globalSetup() {
  const url = process.env.POSTGRES_PRISMA_URL ?? "";
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  if (!isLocal && !process.env.CI) {
    throw new Error(
      "Refusing to run E2E against a non-local database. Point POSTGRES_PRISMA_URL at local/CI Postgres."
    );
  }
  await resetRateLimits();
}
