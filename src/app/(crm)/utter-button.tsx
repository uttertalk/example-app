"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Utter, CHANGED_EVENT } from "utter-sdk/react";

// The Utter button on every signed-in screen. After Utter changes something, the page reloads its
// data so the change shows right away.
export function UtterButton() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, [router]);
  return (
    <Utter
      app="Northwind CRM"
      examples={["Which of my leads have gone quiet for a month?", "What's our biggest open deal?", "Assign every unassigned lead to me"]}
    />
  );
}
