import type { Metadata } from "next";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { TriPanelLayout } from "@/shared/components/layouts/tri-panel";
import { CenterPanel } from "@/shared/components/layouts/center-panel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <TriPanelLayout>
        <CenterPanel>{children}</CenterPanel>
      </TriPanelLayout>
    </TooltipProvider>
  );
}
