import "server-only";
import type { Action, Manifest } from "utter-sdk/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import {
  addActivity,
  getLead,
  listActivities,
  listContacts,
  listDeals,
  listLeads,
  listUsers,
  updateLead,
  type LeadPatch,
} from "./crm";

// What Northwind CRM lets Utter do, and how it runs those actions when Utter asks.
// Every action runs for one company (tenant) and one of its users, with Northwind CRM's own rules.
// Actions marked writes: true only ever run after the person said yes to Utter's plan.

export const MANIFEST: Manifest = {
  app: "Northwind CRM",
  description: "Northwind CRM is a CRM where sales teams track leads, deals, contacts and activities.",
  types: `type Lead = {
  id: string; name: string; email: string; title: string | null; company: string;
  employees: number | null; source: string;           // Website, Referral, Cold email, Trade show, LinkedIn, Webinar
  status: "new" | "contacted" | "qualified" | "unqualified";
  value: number;                                        // estimated deal value in dollars
  ownerId: string | null;                               // a User id, or null when unassigned
  lastContactedAt: string | null; createdAt: string;    // ISO dates
};
type Deal = {
  id: string; leadId: string | null; name: string;
  stage: "discovery" | "proposal" | "negotiation" | "won" | "lost";
  amount: number; closeDate: string | null; ownerId: string | null; createdAt: string;
};
type Contact = { id: string; name: string; email: string; phone: string | null; title: string | null; company: string; createdAt: string };
type Activity = { id: string; leadId: string; userId: string | null; kind: "call" | "email" | "meeting" | "note"; body: string; createdAt: string };
type User = { id: string; name: string; email: string; title: string | null };`,
  actions: [
    { name: "leads.list", args: "(opts?: { status?: string; q?: string })", returns: "Lead[]", description: "All of the company's leads, newest first, optionally filtered by status or a search." },
    { name: "leads.get", args: "(id: string)", returns: "Lead | null", description: "One lead." },
    {
      name: "leads.update",
      args: "(id: string, patch: { status?: string; value?: number; ownerId?: string | null; title?: string })",
      returns: "Lead",
      description: "Change a lead's status, value, owner or title.",
      writes: true,
    },
    { name: "activities.list", args: "(leadId?: string)", returns: "Activity[]", description: "Activities, newest first, for one lead or all." },
    {
      name: "activities.add",
      args: "(input: { leadId: string; kind: 'call' | 'email' | 'meeting' | 'note'; body: string })",
      returns: "Activity",
      description: "Log an activity on a lead as the current user. Calls, emails and meetings also count as contact.",
      writes: true,
    },
    { name: "deals.list", args: "(leadId?: string)", returns: "Deal[]", description: "Deals, biggest first, for one lead or all." },
    { name: "contacts.list", args: "(q?: string)", returns: "Contact[]", description: "People at existing customers." },
    { name: "users.list", args: "()", returns: "User[]", description: "The company's own team (possible lead owners)." },
  ],
};

// Is this user really part of this company? Utter can only act as people who exist here.
export async function isMember(tenantId: string, userId: string): Promise<boolean> {
  const db = await getDb();
  const [u] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.id, userId), eq(schema.users.workspaceId, tenantId)));
  return Boolean(u);
}

const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));

// The actions on the list, run for one company (tenantId) and one of its users (userId).
export const ACTIONS: Record<string, Action> = {
  "leads.list": ({ tenantId }, opts) => {
    const o = (opts ?? {}) as { status?: unknown; q?: unknown };
    return listLeads(tenantId, { status: str(o.status), q: str(o.q) });
  },
  "leads.get": ({ tenantId }, id) => getLead(tenantId, String(id)),
  "leads.update": ({ tenantId }, id, patch) => updateLead(tenantId, String(id), (patch ?? {}) as LeadPatch),
  "activities.list": ({ tenantId }, leadId) => listActivities(tenantId, str(leadId)),
  "activities.add": ({ tenantId, userId }, input) => {
    const i = (input ?? {}) as { leadId?: unknown; kind?: unknown; body?: unknown };
    return addActivity(tenantId, { leadId: String(i.leadId), kind: String(i.kind), body: String(i.body ?? ""), userId });
  },
  "deals.list": ({ tenantId }, leadId) => listDeals(tenantId, str(leadId)),
  "contacts.list": ({ tenantId }, q) => listContacts(tenantId, str(q)),
  "users.list": ({ tenantId }) => listUsers(tenantId),
};
