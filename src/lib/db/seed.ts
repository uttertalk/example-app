import "server-only";
import { hashPassword } from "../crypto";
import type { DB } from "./index";
import * as schema from "./schema";

// Two sample companies with realistic data, so the demo has something to show and
// so it's visible that Utter only ever sees one company's data.
// Runs once, on a database with no workspaces.

const DEMO_PASSWORD = "demo";

const FIRST = [
  "James", "Maria", "Robert", "Linda", "Daniel", "Emma", "Kevin", "Olivia", "Brian", "Sophia",
  "Jason", "Grace", "Eric", "Hannah", "Ryan", "Chloe", "Adam", "Nina", "Luis", "Fatima",
  "Peter", "Megan", "Omar", "Julia", "Victor", "Laura", "Sam", "Isabel", "Noah", "Rachel",
  "Derek", "Yuki", "Owen", "Zara", "Felix", "Anna", "Hugo", "Leah", "Mateo", "Ines",
];
const LAST = [
  "Walker", "Patel", "Kim", "Johnson", "Okafor", "Schmidt", "Rossi", "Nguyen", "Brooks", "Garcia",
  "Turner", "Silva", "Murphy", "Cohen", "Hughes", "Larsen", "Diaz", "Price", "Fischer", "Reyes",
  "Ward", "Ali", "Bennett", "Moreau", "Kowalski", "Yamada", "Foster", "Haddad", "Grant", "Novak",
];
const SOURCES = ["Website", "Referral", "Cold email", "Trade show", "LinkedIn", "Webinar"];

type Profile = {
  id: string;
  name: string;
  domain: string;
  users: { name: string; email: string; title: string }[];
  companies: string[];
  titles: string[];
  value: [number, number];
  employees: [number, number];
  leadCount: number;
  dealNoun: string;
  notes: string[];
};

const PROFILES: Profile[] = [
  {
    id: "ws_greenfield",
    name: "Greenfield Solar",
    domain: "greenfield.demo",
    users: [
      { name: "Sarah Chen", email: "sarah@greenfield.demo", title: "Sales Manager" },
      { name: "Tom Becker", email: "tom@greenfield.demo", title: "Account Executive" },
      { name: "Ava Morales", email: "ava@greenfield.demo", title: "Account Executive" },
    ],
    companies: [
      "Harbor Cold Storage", "Riverside Logistics", "Maple Grove School District", "Summit Packaging",
      "Greenfield Farms", "Lakeview Medical Center", "Ironwood Manufacturing", "Coastal Breweries",
      "Pinecrest Hotels", "Bayside Auto Group", "Oakridge Warehousing", "Sunset Plaza Mall",
      "Redline Distribution", "Valley Fresh Produce", "Westgate Office Park", "Clearwater Plastics",
      "Northfield Arena", "Granite Peak Quarry", "Willow Creek Senior Living", "Metro Bus Depot",
      "Silverline Data Center", "Hillside Vineyards", "Copperfield Foundry", "Brightwater Aquatics",
      "Eastport Marina", "Cedar Lane Church", "Atlas Self Storage", "Prairie Grain Co-op",
    ],
    titles: ["Facilities Manager", "Operations Director", "CFO", "Owner", "Sustainability Lead", "Plant Manager"],
    value: [25_000, 420_000],
    employees: [20, 900],
    leadCount: 64,
    dealNoun: "rooftop install",
    notes: [
      "Asked about payback period, sent the savings estimate.",
      "Roof is 12 years old, may need an inspection first.",
      "Wants battery storage quoted as an option.",
      "Budget decision happens at the board meeting next month.",
      "Comparing us with two other installers.",
      "Interested in the tax credit, sent the one-pager.",
      "Site visit booked, bring the drone.",
      "Electricity bill is around $18k a month.",
    ],
  },
  {
    id: "ws_bluepeak",
    name: "Bluepeak Software",
    domain: "bluepeak.demo",
    users: [
      { name: "Priya Nair", email: "priya@bluepeak.demo", title: "Head of Sales" },
      { name: "Marcus Hill", email: "marcus@bluepeak.demo", title: "Account Executive" },
    ],
    companies: [
      "Brightline Dental", "Fernwood Agency", "Quantum Retail", "Northpoint Legal", "Orbit Fitness",
      "Crescent Bakery Group", "Tidal Media", "Keystone Engineering", "Juniper Health", "Lumen Studios",
      "Parkside Clinics", "Vector Freight", "Mosaic Schools", "Harvest Kitchens", "Nimbus Travel",
      "Sterling Accounting", "Bolt Electric", "Evergreen Realty", "Pioneer Labs", "Cobalt Security",
    ],
    titles: ["HR Director", "People Ops Lead", "COO", "Founder", "Office Manager", "Head of Talent"],
    value: [6_000, 120_000],
    employees: [15, 600],
    leadCount: 46,
    dealNoun: "HR suite rollout",
    notes: [
      "Currently on spreadsheets for time off, very interested.",
      "Asked for a security questionnaire.",
      "Wants payroll integration with their current provider.",
      "Trial account created for 10 seats.",
      "Contract with their current vendor ends in March.",
      "Demo went well, they want to loop in finance.",
      "Concerned about migration effort.",
    ],
  },
];

// Small seeded random generator so the sample data is the same on every fresh database.
function rng(seedValue: number) {
  let s = seedValue >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

export async function seed(db: DB) {
  const existing = await db.select({ id: schema.workspaces.id }).from(schema.workspaces).limit(1);
  if (existing.length > 0) return;

  const now = Date.now();
  const passwordHash = hashPassword(DEMO_PASSWORD);

  for (const [pi, p] of PROFILES.entries()) {
    const rand = rng(1234 + pi * 97);
    const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
    const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
    const daysAgo = (d: number) => new Date(now - d * DAY - between(0, 10) * 3_600_000);
    let n = 0;
    const id = (prefix: string) => `${prefix}_${p.id.slice(3)}_${++n}`;

    await db.insert(schema.workspaces).values({ id: p.id, name: p.name, createdAt: daysAgo(200) });

    const userIds = p.users.map((u, i) => `u_${p.id.slice(3)}_${i + 1}`);
    await db.insert(schema.users).values(
      p.users.map((u, i) => ({ id: userIds[i], workspaceId: p.id, ...u, passwordHash })),
    );

    const leadRows: (typeof schema.leads.$inferInsert)[] = [];
    const activityRows: (typeof schema.activities.$inferInsert)[] = [];
    const dealRows: (typeof schema.deals.$inferInsert)[] = [];

    for (let i = 0; i < p.leadCount; i++) {
      const first = pick(FIRST);
      const last = pick(LAST);
      const company = p.companies[i % p.companies.length];
      const r = rand();
      const status = r < 0.28 ? "new" : r < 0.6 ? "contacted" : r < 0.85 ? "qualified" : "unqualified";
      const createdDays = between(4, 140);
      const lastContactDays =
        status === "new" ? null : Math.min(createdDays - 1, Math.round(Math.pow(rand(), 1.6) * 70));
      const ownerId = rand() < 0.15 ? null : pick(userIds);
      const leadId = id("lead");
      const slug = company.toLowerCase().replace(/[^a-z]+/g, "");
      leadRows.push({
        id: leadId,
        workspaceId: p.id,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${slug}.com`,
        title: pick(p.titles),
        company,
        employees: between(p.employees[0], p.employees[1]),
        source: pick(SOURCES),
        status,
        value: Math.round(between(p.value[0], p.value[1]) / 500) * 500,
        ownerId,
        lastContactedAt: lastContactDays === null ? null : daysAgo(lastContactDays),
        createdAt: daysAgo(createdDays),
      });

      if (lastContactDays !== null) {
        const count = between(1, 4);
        for (let a = 0; a < count; a++) {
          const kind = pick(["call", "email", "meeting", "note"]);
          const when = a === 0 ? lastContactDays : between(lastContactDays + 1, Math.max(lastContactDays + 2, createdDays));
          const body =
            kind === "note"
              ? pick(p.notes)
              : kind === "call"
                ? pick(["Intro call, ", "Follow-up call, ", "Quick check-in, "]) + pick(p.notes).toLowerCase()
                : kind === "email"
                  ? pick(["Sent pricing. ", "Sent case study. ", "Followed up by email. "]) + pick(p.notes)
                  : pick(["Meeting on site. ", "Video meeting. "]) + pick(p.notes);
          activityRows.push({
            id: id("act"),
            workspaceId: p.id,
            leadId,
            userId: ownerId ?? pick(userIds),
            kind,
            body,
            createdAt: daysAgo(when),
          });
        }
      }

      if (status === "qualified" || (status === "contacted" && rand() < 0.2)) {
        const s = rand();
        const stage = s < 0.35 ? "discovery" : s < 0.6 ? "proposal" : s < 0.78 ? "negotiation" : s < 0.92 ? "won" : "lost";
        dealRows.push({
          id: id("deal"),
          workspaceId: p.id,
          leadId,
          name: `${company} ${p.dealNoun}`,
          stage,
          amount: leadRows[leadRows.length - 1].value!,
          closeDate: new Date(now + between(-20, 90) * DAY),
          ownerId: ownerId ?? pick(userIds),
          createdAt: daysAgo(Math.max(1, (lastContactDays ?? 5) + between(0, 10))),
        });
      }
    }

    await db.insert(schema.leads).values(leadRows);
    if (activityRows.length) await db.insert(schema.activities).values(activityRows);
    if (dealRows.length) await db.insert(schema.deals).values(dealRows);

    const contactRows = Array.from({ length: 24 }, () => {
      const first = pick(FIRST);
      const last = pick(LAST);
      const company = pick(p.companies);
      const slug = company.toLowerCase().replace(/[^a-z]+/g, "");
      return {
        id: id("contact"),
        workspaceId: p.id,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}@${slug}.com`,
        phone: `+1 (${between(200, 989)}) ${between(200, 989)}-${String(between(0, 9999)).padStart(4, "0")}`,
        title: pick(p.titles),
        company,
        createdAt: daysAgo(between(30, 300)),
      };
    });
    await db.insert(schema.contacts).values(contactRows);
  }
}
