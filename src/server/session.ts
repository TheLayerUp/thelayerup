import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "./auth";
import { prisma } from "./db";

// connection() marks this as request-time work: auth() reads cookies and
// uses crypto, neither of which can run during prerendering.
export const getSession = cache(async () => {
  await connection();
  return auth();
});

/** Redirects to login (preserving where the user was headed) if signed out. */
export async function requireUser(callbackUrl: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session.user;
}

// The JWT role is set at sign-in; re-read it so a demoted admin loses access immediately.
const isAdminInDb = cache(async (userId: string) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === "ADMIN";
});

export async function requireAdmin() {
  const user = await requireUser("/admin");
  // 404 rather than 403 so the admin area isn't advertised.
  if (user.role !== "ADMIN" || !(await isAdminInDb(user.id))) notFound();
  return user;
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN" || !(await isAdminInDb(session.user.id))) {
    throw new Error("Not authorised");
  }
  return session.user;
}
