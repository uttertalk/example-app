import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { listContacts } from "@/lib/crm";
import { PageHeader } from "@/components/ui";

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const { workspace } = await requireViewer();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const contacts = await listContacts(workspace.id, q);

  return (
    <>
      <PageHeader title="Contacts" sub={`${contacts.length} people at your customers`} />
      <div className="px-6 py-4">
        <form className="flex items-center gap-2">
          <input name="q" defaultValue={q} placeholder="Search name or company" className="field w-[280px]" />
          <button className="btn">Search</button>
          {q && (
            <Link href="/contacts" className="text-[13px] text-muted hover:text-ink">
              Clear
            </Link>
          )}
        </form>
        <div className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-panel">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line text-[12px] text-faint">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5">{c.company}</td>
                  <td className="px-4 py-2.5 text-muted">{c.title}</td>
                  <td className="px-4 py-2.5 text-muted">{c.email}</td>
                  <td className="px-4 py-2.5 text-muted tabular-nums">{c.phone}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No contacts match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
