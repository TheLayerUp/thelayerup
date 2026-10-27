import type { DefaultSession } from "next-auth";

// Adds our fields to the Auth.js session (set in the jwt/session callbacks in server/auth.ts).
declare module "next-auth" {
  interface Session {
    user: { id: string; role: "CUSTOMER" | "ADMIN" } & DefaultSession["user"];
  }
}
