import "server-only";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getDb, schema } from "./db";
import { newId } from "./crypto";

// Every read and write is scoped to one workspace, so one company never sees another's data.

export const LEAD_STATUSES = ["new", "contacted", "qualified", "unqualified"] as const;
export const DEAL_STAGES = ["discovery", "proposal", "negotiation", "won", "lost"] as const;
export const ACTIVITY_KINDS = ["call", "email", "meeting", "note"] as const;

export async function listUsers(workspaceId: string) {
  const db = await getDb();
  return db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, title: schema.users.title })
    .from(schema.users)
    .where(eq(schema.users.workspaceId, workspaceId))
    .orderBy(asc(schema.users.name));
}

export async function listLeads(workspaceId: string, opts: { q?: string; status?: string } = {}) {
  const db = await getDb();
  const filters = [eq(schema.leads.workspaceId, workspaceId)];
  if (opts.status) filters.push(eq(schema.leads.status, opts.status));
  if (opts.q) {
    const like = `%${opts.q}%`;
    filters.push(or(ilike(schema.leads.name, like), ilike(schema.leads.company, like), ilike(schema.leads.email, like))!);
  }
  return db
    .select()
    .from(schema.leads)
    .where(and(...filters))
    .orderBy(desc(schema.leads.createdAt));
}

export async function getLead(workspaceId: string, id: string) {
  const db = await getDb();
  const [lead] = await db
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.workspaceId, workspaceId), eq(schema.leads.id, id)));
  return lead ?? null;
}

export type LeadPatch = Partial<{
  status: string;
  value: number;
  ownerId: string | null;
  title: string;
}>;

export async function updateLead(workspaceId: string, id: string, patch: LeadPatch) {
  const db = await getDb();
  const clean: LeadPatch = {};
  if (patch.status !== undefined) {
    if (!(LEAD_STATUSES as readonly string[]).includes(patch.status)) throw new Error(`Unknown status: ${patch.status}`);
    clean.status = patch.status;
  }
  if (patch.value !== undefined) clean.value = Math.max(0, Math.round(Number(patch.value)) || 0);
  if (patch.title !== undefined) clean.title = String(patch.title);
  if (patch.ownerId !== undefined) {
    if (patch.ownerId !== null) {
      const users = await listUsers(workspaceId);
      if (!users.some((u) => u.id === patch.ownerId)) throw new Error("Owner is not in this workspace");
    }
    clean.ownerId = patch.ownerId;
  }
  if (Object.keys(clean).length === 0) return getLead(workspaceId, id);
  const [lead] = await db
    .update(schema.leads)
    .set(clean)
    .where(and(eq(schema.leads.workspaceId, workspaceId), eq(schema.leads.id, id)))
    .returning();
  return lead ?? null;
}

export async function listActivities(workspaceId: string, leadId?: string) {
  const db = await getDb();
  const filters = [eq(schema.activities.workspaceId, workspaceId)];
  if (leadId) filters.push(eq(schema.activities.leadId, leadId));
  return db
    .select()
    .from(schema.activities)
    .where(and(...filters))
    .orderBy(desc(schema.activities.createdAt));
}

export async function addActivity(
  workspaceId: string,
  input: { leadId: string; kind: string; body: string; userId?: string | null },
) {
  const db = await getDb();
  if (!(ACTIVITY_KINDS as readonly string[]).includes(input.kind)) throw new Error(`Unknown activity kind: ${input.kind}`);
  const lead = await getLead(workspaceId, input.leadId);
  if (!lead) throw new Error("Lead not found");
  const now = new Date();
  const [row] = await db
    .insert(schema.activities)
    .values({
      id: newId(),
      workspaceId,
      leadId: lead.id,
      userId: input.userId ?? null,
      kind: input.kind,
      body: input.body.trim(),
      createdAt: now,
    })
    .returning();
  // Logging a call, email or meeting counts as contact.
  if (input.kind !== "note") {
    await db
      .update(schema.leads)
      .set({ lastContactedAt: now, ...(lead.status === "new" ? { status: "contacted" } : {}) })
      .where(eq(schema.leads.id, lead.id));
  }
  return row;
}

export async function listDeals(workspaceId: string, leadId?: string) {
  const db = await getDb();
  const filters = [eq(schema.deals.workspaceId, workspaceId)];
  if (leadId) filters.push(eq(schema.deals.leadId, leadId));
  return db
    .select()
    .from(schema.deals)
    .where(and(...filters))
    .orderBy(desc(schema.deals.amount));
}

export async function listContacts(workspaceId: string, q?: string) {
  const db = await getDb();
  const filters = [eq(schema.contacts.workspaceId, workspaceId)];
  if (q) {
    const like = `%${q}%`;
    filters.push(or(ilike(schema.contacts.name, like), ilike(schema.contacts.company, like))!);
  }
  return db
    .select()
    .from(schema.contacts)
    .where(and(...filters))
    .orderBy(asc(schema.contacts.name));
}
