import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import {
  ACTIVITY_KINDS,
  LEAD_STATUSES,
  addActivity,
  getLead,
  listActivities,
  listDeals,
  listUsers,
  updateLead,
} from "@/lib/crm";
import { ago, capitalize, money, shortDate } from "@/lib/format";
import { Avatar, Badge, STAGE_TONE, STATUS_TONE } from "@/components/ui";

async function saveLead(formData: FormData) {
  "use server";
  const { workspace } = await requireViewer();
  const id = String(formData.get("id"));
  const owner = String(formData.get("ownerId") ?? "");
  await updateLead(workspace.id, id, {
    status: String(formData.get("status")),
    ownerId: owner || null,
    value: Number(formData.get("value")),
  });
  revalidatePath(`/leads/${id}`);
}

async function logActivity(formData: FormData) {
  "use server";
  const { user, workspace } = await requireViewer();
  const leadId = String(formData.get("leadId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addActivity(workspace.id, { leadId, kind: String(formData.get("kind")), body, userId: user.id });
  revalidatePath(`/leads/${leadId}`);
}

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { workspace } = await requireViewer();
  const { id } = await params;
  const lead = await getLead(workspace.id, id);
  if (!lead) notFound();
  const [activities, deals, users] = await Promise.all([
    listActivities(workspace.id, lead.id),
    listDeals(workspace.id, lead.id),
    listUsers(workspace.id),
  ]);
  const names = new Map(users.map((u) => [u.id, u.name]));

  return (
    <>
      <div className="border-b border-line bg-panel px-6 py-5">
        <Link href="/leads" className="text-[12px] text-muted hover:text-ink">
          ← Leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{lead.name}</h1>
          <Badge tone={STATUS_TONE[lead.status]}>{capitalize(lead.status)}</Badge>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {lead.title} at {lead.company} · {lead.email}
        </p>
      </div>

      <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <section className="rounded-[10px] border border-line bg-panel p-4">
            <h2 className="text-[13px] font-semibold">Log activity</h2>
            <form action={logActivity} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                name="body"
                rows={2}
                placeholder="What happened?"
                className="field h-auto py-2"
                required
              />
              <div className="flex items-center gap-2">
                <select name="kind" className="field" defaultValue="call">
                  {ACTIVITY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {capitalize(k)}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary">Save</button>
              </div>
            </form>
          </section>

          <section className="mt-5">
            <h2 className="text-[13px] font-semibold">Activity</h2>
            {activities.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">No activity yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {activities.map((a) => (
                  <li key={a.id} className="flex gap-3 rounded-[10px] border border-line bg-panel p-3">
                    <Avatar name={a.userId ? (names.get(a.userId) ?? "?") : "?"} size={26} />
                    <div className="min-w-0">
                      <p className="text-[12px] text-faint">
                        <span className="font-medium text-muted">{capitalize(a.kind)}</span> ·{" "}
                        {a.userId ? names.get(a.userId) : "Someone"} · {ago(a.createdAt)}
                      </p>
                      <p className="mt-0.5 text-[13px]">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-[10px] border border-line bg-panel p-4">
            <h2 className="text-[13px] font-semibold">Details</h2>
            <form action={saveLead} className="mt-3 flex flex-col gap-3 text-[13px]">
              <input type="hidden" name="id" value={lead.id} />
              <label className="flex flex-col gap-1 text-muted">
                Status
                <select name="status" defaultValue={lead.status} className="field">
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {capitalize(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-muted">
                Owner
                <select name="ownerId" defaultValue={lead.ownerId ?? ""} className="field">
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-muted">
                Value ($)
                <input name="value" type="number" min={0} step={500} defaultValue={lead.value} className="field" />
              </label>
              <button className="btn self-start">Save changes</button>
            </form>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-line pt-3 text-[13px]">
              <dt className="text-faint">Employees</dt>
              <dd>{lead.employees ?? "Unknown"}</dd>
              <dt className="text-faint">Source</dt>
              <dd>{lead.source}</dd>
              <dt className="text-faint">Last contact</dt>
              <dd>{ago(lead.lastContactedAt)}</dd>
              <dt className="text-faint">Created</dt>
              <dd>{shortDate(lead.createdAt)}</dd>
            </dl>
          </section>

          <section className="rounded-[10px] border border-line bg-panel p-4">
            <h2 className="text-[13px] font-semibold">Deals</h2>
            {deals.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">No deals yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {deals.map((d) => (
                  <li key={d.id} className="text-[13px]">
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-1 flex items-center gap-2 text-muted">
                      <Badge tone={STAGE_TONE[d.stage]}>{capitalize(d.stage)}</Badge>
                      {money(d.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
