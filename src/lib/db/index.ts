import "server-only";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { seed } from "./seed";

// Tables are created on first use, so a fresh database needs no migration step.
const INIT_SQL = `
create table if not exists workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists users (
  id text primary key,
  workspace_id text not null,
  name text not null,
  email text not null unique,
  title text,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  id text primary key,
  user_id text not null,
  expires_at timestamptz not null
);
create table if not exists leads (
  id text primary key,
  workspace_id text not null,
  name text not null,
  email text not null,
  title text,
  company text not null,
  employees integer,
  source text not null,
  status text not null default 'new',
  value integer not null default 0,
  owner_id text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists contacts (
  id text primary key,
  workspace_id text not null,
  name text not null,
  email text not null,
  phone text,
  title text,
  company text not null,
  created_at timestamptz not null default now()
);
create table if not exists deals (
  id text primary key,
  workspace_id text not null,
  lead_id text,
  name text not null,
  stage text not null default 'discovery',
  amount integer not null default 0,
  close_date timestamptz,
  owner_id text,
  created_at timestamptz not null default now()
);
create table if not exists activities (
  id text primary key,
  workspace_id text not null,
  lead_id text not null,
  user_id text,
  kind text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists leads_ws_idx on leads (workspace_id);
create index if not exists contacts_ws_idx on contacts (workspace_id);
create index if not exists deals_ws_idx on deals (workspace_id);
create index if not exists activities_lead_idx on activities (lead_id, created_at desc);
`;

export type DB = PostgresJsDatabase<typeof schema>;

const g = globalThis as unknown as { __demoDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  let db: DB;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { prepare: false, max: 5 });
    await client.unsafe(INIT_SQL);
    db = drizzle(client, { schema });
  } else {
    // No DATABASE_URL: local embedded Postgres stored in .data/
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { mkdirSync } = await import("node:fs");
    mkdirSync("./.data", { recursive: true });
    const client = new PGlite("./.data/pglite");
    await client.exec(INIT_SQL);
    db = drizzle(client, { schema }) as unknown as DB;
  }
  await seed(db);
  return db;
}

export function getDb(): Promise<DB> {
  if (!g.__demoDb) {
    g.__demoDb = connect().catch((e) => {
      g.__demoDb = undefined;
      throw e;
    });
  }
  return g.__demoDb;
}

export { schema };
