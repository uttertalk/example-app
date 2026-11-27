import type { ReactNode } from "react";
import { requireViewer, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui";
import { NavLinks } from "./nav-links";
import { UtterButton } from "./utter-button";

async function logout() {
  "use server";
  await signOut();
  redirect("/login");
}

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireViewer();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-line bg-panel">
        <div className="px-4 pt-4 pb-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">Northwind CRM</p>
          <p className="mt-0.5 truncate text-[12px] text-faint">{workspace.name}</p>
        </div>
        <NavLinks />
        <div className="mt-auto border-t border-line p-3">
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size={28} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="truncate text-[12px] text-faint">{user.title}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="mt-3 text-[12px] text-muted hover:text-ink">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      <UtterButton />
    </div>
  );
}
