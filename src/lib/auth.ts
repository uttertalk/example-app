import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { checkPassword, newId } from "./crypto";
import type { User, Workspace } from "./db/schema";

const SESSION_COOKIE = "ss_session";
const SESSION_DAYS = 30;

export async function signIn(email: string, password: string): Promise<boolean> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.trim().toLowerCase()));
  if (!user || !checkPassword(password, user.passwordHash)) return false;
  const id = newId(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ id, userId: user.id, expiresAt });
  (await cookies()).set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function signOut() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  }
  jar.delete(SESSION_COOKIE);
}

export type Viewer = { user: User; workspace: Workspace };

export async function getViewer(): Promise<Viewer | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = await getDb();
  const [row] = await db
    .select({ user: schema.users, workspace: schema.workspaces, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.users.workspaceId))
    .where(eq(schema.sessions.id, id));
  if (!row || row.expiresAt < new Date()) return null;
  return { user: row.user, workspace: row.workspace };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
