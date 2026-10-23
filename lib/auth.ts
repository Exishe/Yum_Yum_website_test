import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, type User, type UserRole } from "@/db/schema";
import { env } from "./env";
import { rateLimit, sha256 } from "./security";

const COOKIE = env.isProd ? "__Host-yy_admin" : "yy_admin";
const SESSION_HOURS = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
// A real bcrypt hash of a random string, so unknown emails take as long as known ones.
const DUMMY_HASH = "$2b$12$zzCnOVufT8AJkE9F/aWsK.djh0ThF6zozQLUnkadRsB6T6TOjxnCO";

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "mustChangePassword">;

async function setCookie(token: string, expires: Date) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt, userAgent: ua });
  await setCookie(token, expiresAt);
  // Housekeeping: drop expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/** The signed-in staff member, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isActive) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.mustChangePassword,
  };
});

/** Use at the top of every admin page and server action. */
export async function requireUser(roles: UserRole[] = ["admin", "staff"]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}

export type LoginResult = { ok: true; mustChangePassword: boolean } | { ok: false; error: string };

export async function login(email: string, password: string, ip: string): Promise<LoginResult> {
  if (!(await rateLimit(`login:ip:${ip}`, 20, 15 * 60))) {
    return { ok: false, error: "Too many attempts from this network. Try again in 15 minutes." };
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const generic = { ok: false as const, error: "Wrong email or password." };

  if (!user || !user.isActive) {
    await bcrypt.compare(password, DUMMY_HASH);
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: `Account locked after too many attempts. Try again after ${LOCK_MINUTES} minutes.` };
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLogins + 1;
    await db
      .update(users)
      .set(
        failed >= MAX_FAILED
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
          : { failedLogins: failed },
      )
      .where(eq(users.id, user.id));
    return generic;
  }
  await db
    .update(users)
    .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id);
  return { ok: true, mustChangePassword: user.mustChangePassword };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export async function logoutEverywhere(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(userId: number, password: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return !!u && bcrypt.compare(password, u.passwordHash);
}
