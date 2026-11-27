import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { DEAL_STAGES, listDeals, listUsers } from "@/lib/crm";
import { capitalize, money, shortDate } from "@/lib/format";
import { Badge, PageHeader, STAGE_TONE } from "@/components/ui";

export default async function DealsPage() {
  const { workspace } = await requireViewer();
  const [deals, users] = await Promise.all([listDeals(workspace.id), listUsers(workspace.id)]);
  const owners = new Map(users.map((u) => [u.id, u.name]));
  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = deals.filter((d) => d.stage === "won");

  return (
    <>
      <PageHeader
        title="Deals"
        sub={`${open.length} open · ${money(open.reduce((s, d) => s + d.amount, 0))} in pipeline · ${money(
          won.reduce((s, d) => s + d.amount, 0),
        )} won`}
      />
      <div className="grid gap-3 overflow-x-auto px-6 py-5 [grid-template-columns:repeat(5,minmax(220px,1fr))]">
        {DEAL_STAGES.map((stage) => {
          const list = deals.filter((d) => d.stage === stage);
          return (
            <section key={stage} className="flex min-w-0 flex-col rounded-[10px] border border-line bg-panel-2/60">
              <header className="flex items-center justify-between px-3 py-2.5">
                <Badge tone={STAGE_TONE[stage]}>{capitalize(stage)}</Badge>
                <span className="text-[12px] text-faint tabular-nums">
                  {list.length} · {money(list.reduce((s, d) => s + d.amount, 0))}
                </span>
              </header>
              <div className="flex flex-col gap-2 px-2 pb-2">
                {list.map((d) => (
                  <div key={d.id} className="rounded-[8px] border border-line bg-panel p-3 text-[13px]">
                    {d.leadId ? (
                      <Link href={`/leads/${d.leadId}`} className="font-medium hover:underline">
                        {d.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{d.name}</p>
                    )}
                    <p className="mt-1 tabular-nums">{money(d.amount)}</p>
                    <p className="mt-1 text-[12px] text-faint">
                      {d.ownerId ? owners.get(d.ownerId) : "Unassigned"}
                      {d.closeDate ? ` · closes ${shortDate(d.closeDate)}` : ""}
                    </p>
                  </div>
                ))}
                {list.length === 0 && <p className="px-2 py-3 text-[12px] text-faint">No deals.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
