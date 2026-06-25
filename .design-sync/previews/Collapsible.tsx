import { Collapsible, CollapsibleTrigger, CollapsibleContent, Button } from "tunnelfiles";
import { ChevronsUpDown } from "lucide-react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate font-mono" title={value}>
        {value}
      </span>
    </div>
  );
}

export const Open = () => (
  <Frame>
    <Collapsible defaultOpen className="w-full max-w-sm space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          Advanced options
          <ChevronsUpDown className="size-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border space-y-3 rounded-md border p-3">
        <Row label="Keepalive interval" value="60s" />
        <Row label="Compression" value="enabled" />
        <Row label="Connection timeout" value="30s" />
      </CollapsibleContent>
    </Collapsible>
  </Frame>
);
