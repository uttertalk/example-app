import { redirect } from "next/navigation";
import { getViewer, signIn } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { email: "sarah@greenfield.demo", who: "Sarah Chen, Greenfield Solar" },
  { email: "tom@greenfield.demo", who: "Tom Becker, Greenfield Solar" },
  { email: "priya@bluepeak.demo", who: "Priya Nair, Bluepeak Software" },
];

async function login(formData: FormData) {
  "use server";
  const ok = await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  redirect(ok ? "/leads" : "/login?error=1");
}

export default async function Login({ searchParams }: PageProps<"/login">) {
  if (await getViewer()) redirect("/leads");
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[380px]">
        <p className="text-[18px] font-semibold tracking-[-0.01em]">Northwind CRM</p>
        <div className="mt-6 rounded-[10px] border border-line bg-panel p-6">
          <h1 className="text-[17px] font-semibold">Sign in</h1>
          {error && <p className="mt-3 text-[13px] text-bad">Wrong email or password.</p>}
          <form action={login} className="mt-5 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[13px] text-muted">
              Email
              <input name="email" type="email" required className="field" defaultValue="sarah@greenfield.demo" />
            </label>
            <label className="flex flex-col gap-1 text-[13px] text-muted">
              Password
              <input name="password" type="password" required className="field" defaultValue="demo" />
            </label>
            <button className="btn btn-primary mt-2 h-9">Sign in</button>
          </form>
        </div>
        <div className="mt-5 text-[12px] leading-5 text-faint">
          <p>Demo accounts, password <span className="font-mono">demo</span>:</p>
          <ul className="mt-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <span className="font-mono">{a.email}</span> ({a.who})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
