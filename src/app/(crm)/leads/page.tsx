import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { LEAD_STATUSES, listLeads, listUsers } from "@/lib/crm";
import { ago, capitalize, daysSince, money } from "@/lib/format";
import { Badge, PageHeader, STATUS_TONE } from "@/components/ui";

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const viewer = await requireViewer();
  const { workspace } = viewer;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && sp.status ? sp.status : "";
  const [leads, users] = await Promise.all([listLeads(workspace.id, { q, status }), listUsers(workspace.id)]);
  const owners = new Map(users.map((u) => [u.id, u.name]));
  const total = leads.reduce((sum, l) => sum + l.value, 0);

  return (
    <>
      <PageHeader title="Leads" sub={`${leads.length} leads · ${money(total)} potential value`} />
      <div className="px-6 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <form className="flex flex-wrap items-center gap-2">
              <input name="q" defaultValue={q} placeholder="Search name, company or email" className="field w-[280px]" />
              <select name="status" defaultValue={status} className="field">
                <option value="">All statuses</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {capitalize(s)}
                  </option>
                ))}
              </select>
              <button className="btn">Filter</button>
              {(q || status) && (
                <Link href="/leads" className="text-[13px] text-muted hover:text-ink">
                  Clear
                </Link>
              )}
            </form>
          </div>

          <div className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-panel">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="border-b border-line text-[12px] text-faint">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Company</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Value</th>
                  <th className="px-3 py-2.5 font-medium">Source</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Last contact</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const quiet = daysSince(l.lastContactedAt);
                  return (
                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-panel-2/60">
                      <td className="px-3 py-2.5">
                        <Link href={`/leads/${l.id}`} className="font-medium hover:underline">
                          {l.name}
                        </Link>
                        <p className="text-[12px] text-faint">{l.title}</p>
                      </td>
                      <td className="px-3 py-2.5">{l.company}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={STATUS_TONE[l.status]}>{capitalize(l.status)}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{money(l.value)}</td>
                      <td className="px-3 py-2.5 text-muted">{l.source}</td>
                      <td className="px-3 py-2.5 text-muted">{l.ownerId ? owners.get(l.ownerId) : "Unassigned"}</td>
                      <td className={`px-3 py-2.5 ${quiet !== null && quiet > 30 ? "text-bad" : "text-muted"}`}>
                        {ago(l.lastContactedAt)}
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted">
                      No leads match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
