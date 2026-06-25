import { ContextMenu, ContextMenuTrigger } from "tunnelfiles";
import { FileArchive } from "lucide-react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

// NOTE: Radix ContextMenu has NO `defaultOpen` — its menu only opens on a real
// right-click at the cursor, which cannot be triggered in a static screenshot.
// So we render the styled trigger zone (a file-row) only; the open menu is
// interaction-only and not statically renderable.
export const Trigger = () => (
  <Frame className="flex min-h-[420px] items-center justify-center">
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="border-border bg-card flex w-72 cursor-context-menu items-center gap-3 rounded-md border border-dashed px-4 py-3 text-sm">
          <FileArchive className="text-muted-foreground size-4 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate font-mono" title="deploy.tar.gz">
              deploy.tar.gz
            </span>
            <span className="text-muted-foreground text-xs">Right-click for actions</span>
          </div>
        </div>
      </ContextMenuTrigger>
    </ContextMenu>
  </Frame>
);
