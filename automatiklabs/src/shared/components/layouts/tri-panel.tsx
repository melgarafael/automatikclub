import { LeftSidebar } from "./left-sidebar";
import { StatusBar } from "./status-bar";
import { RightPanel } from "./right-panel";

export function TriPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-[56px_1fr_280px] grid-rows-[1fr_28px] overflow-hidden bg-bg">
      {/* Rail — 56px icon sidebar, spans both rows */}
      <LeftSidebar />

      {/* Center — main content area */}
      <main
        id="main-content"
        className="col-start-2 row-start-1 flex flex-col items-center overflow-y-auto"
      >
        {children}
      </main>

      {/* Right panel — 280px, spans both rows */}
      <RightPanel />

      {/* Status bar — bottom of center panel */}
      <StatusBar />
    </div>
  );
}

export default TriPanelLayout;
