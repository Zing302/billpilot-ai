"use client";

import { BillPanel } from "@/components/bill/bill-panel";
import { ExplorerPanel } from "@/components/explorer/explorer-panel";
import { TabBar } from "@/components/ui/tab-bar";
import Link from "next/link";
import { useId, useState } from "react";

type Flow = "explorer" | "bill";

type AppShellProps = {
  initialFlow?: Flow;
};

export function AppShell({ initialFlow = "explorer" }: AppShellProps) {
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const explorerTabId = useId();
  const billTabId = useId();
  const explorerPanelId = useId();
  const billPanelId = useId();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to Main Content
      </a>
      <div aria-hidden="true" className="bg-orb orb-a" />
      <div aria-hidden="true" className="bg-orb orb-b" />
      <div aria-hidden="true" className="bg-orb orb-c" />
      <main className="shell" id="main-content">
        <header className="app-nav">
          <div className="app-nav-inner">
            <Link className="brand brand-link" href="/">
              BillPilot AI
            </Link>
            <div className="app-nav-actions">
              <TabBar
                flow={flow}
                explorerTabId={explorerTabId}
                billTabId={billTabId}
                explorerPanelId={explorerPanelId}
                billPanelId={billPanelId}
                onChange={setFlow}
              />
            </div>
          </div>
        </header>

        <div className="page">
          {flow === "explorer" ? (
            <ExplorerPanel panelId={explorerPanelId} tabId={explorerTabId} />
          ) : (
            <BillPanel panelId={billPanelId} tabId={billTabId} />
          )}
        </div>
      </main>
    </>
  );
}
