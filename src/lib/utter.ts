import "server-only";
import { createUtter } from "utter-sdk/server";
import { getViewer, type Viewer } from "./auth";
import { ACTIONS, MANIFEST, isMember } from "./utter-host";

// Northwind CRM's connection to Utter, through the utter-sdk package, the same way any company
// connects. Settings: UTTER_URL, UTTER_PROJECT and UTTER_SECRET in .env.local.

// Northwind CRM's signed-in person, as Utter sees them: their company is the tenant.
const toViewer = (v: Viewer) => ({
  tenant: { id: v.workspace.id, name: v.workspace.name },
  user: { id: v.user.id, name: v.user.name, title: v.user.title },
});

export const utter = createUtter({
  manifest: MANIFEST,
  actions: ACTIONS,
  isMember,
  getViewer: async () => {
    const v = await getViewer();
    return v ? toViewer(v) : null;
  },
});
