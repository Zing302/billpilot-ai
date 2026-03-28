"use client";

import { BillPanel } from "@/components/bill/bill-panel";
import { ExplorerPanel } from "@/components/explorer/explorer-panel";
import { TabBar } from "@/components/ui/tab-bar";
import { useId, useState } from "react";

type Flow = "explorer" | "bill";

export function AppShell() {
  const [flow, setFlow] = useState<Flow>("explorer");
  const explorerTabId = useId();
  const billTabId = useId();
  const explorerPanelId = useId();
  const billPanelId = useId();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to Main Content
      </a>
      <main className="shell" id="main-content">
        <header className="header">
          <div className="topbar">
            <strong className="brand">BillPilot AI</strong>
            <TabBar
              flow={flow}
              explorerTabId={explorerTabId}
              billTabId={billTabId}
              explorerPanelId={explorerPanelId}
              billPanelId={billPanelId}
              onChange={setFlow}
            />
          </div>
        </header>

        {flow === "explorer" ? (
          <ExplorerPanel panelId={explorerPanelId} tabId={explorerTabId} />
        ) : (
          <BillPanel panelId={billPanelId} tabId={billTabId} />
        )}
      </main>
    </>
  );
}
