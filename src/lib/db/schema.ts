import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// A workspace is one company using the CRM. Everything else belongs to exactly one.
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  title: text("title"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  title: text("title"),
  company: text("company").notNull(),
  employees: integer("employees"),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  value: integer("value").notNull().default(0),
  ownerId: text("owner_id"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title"),
  company: text("company").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  leadId: text("lead_id"),
  name: text("name").notNull(),
  stage: text("stage").notNull().default("discovery"),
  amount: integer("amount").notNull().default(0),
  closeDate: timestamp("close_date", { withTimezone: true }),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  leadId: text("lead_id").notNull(),
  userId: text("user_id"),
  kind: text("kind").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Activity = typeof activities.$inferSelect;
