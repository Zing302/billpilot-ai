type Flow = "explorer" | "bill";

type TabBarProps = {
  flow: Flow;
  explorerTabId: string;
  billTabId: string;
  explorerPanelId: string;
  billPanelId: string;
  onChange: (flow: Flow) => void;
};

export function TabBar({
  flow,
  explorerTabId,
  billTabId,
  explorerPanelId,
  billPanelId,
  onChange,
}: TabBarProps) {
  return (
    <section className="tab-bar" aria-label="BillPilot workflows" role="tablist">
      <button
        id={billTabId}
        role="tab"
        aria-selected={flow === "bill"}
        aria-controls={billPanelId}
        className={flow === "bill" ? "tab-link tab-link-active" : "tab-link"}
        type="button"
        onClick={() => onChange("bill")}
      >
        Review a bill
      </button>
      <button
        id={explorerTabId}
        role="tab"
        aria-selected={flow === "explorer"}
        aria-controls={explorerPanelId}
        className={flow === "explorer" ? "tab-link tab-link-active" : "tab-link"}
        type="button"
        onClick={() => onChange("explorer")}
      >
        Plan care costs
      </button>
    </section>
  );
}
