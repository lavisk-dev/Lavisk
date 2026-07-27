import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/shared/ambient-background";
import { ClientShell } from "./client-shell";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <ClientShell>{children}</ClientShell>
    </>
  );
}
