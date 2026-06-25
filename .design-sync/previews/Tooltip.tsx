import { Tooltip, TooltipTrigger, TooltipContent, Button } from "tunnelfiles";
import { ShieldCheck } from "lucide-react";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Hint = () => (
  <Frame className="flex min-h-[220px] items-center justify-center">
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Host key status">
          <ShieldCheck />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Host key verified (SHA256)</TooltipContent>
    </Tooltip>
  </Frame>
);
