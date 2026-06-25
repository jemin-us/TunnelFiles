import { Checkbox, Label } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Options = () => (
  <Frame className="space-y-3">
    <div className="flex items-center gap-2">
      <Checkbox id="remember-host-key" defaultChecked />
      <Label htmlFor="remember-host-key">Remember host key</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="follow-dir" />
      <Label htmlFor="follow-dir">Follow directory on cd</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="show-hidden" defaultChecked />
      <Label htmlFor="show-hidden">Show hidden files</Label>
    </div>
  </Frame>
);

export const Disabled = () => (
  <Frame className="space-y-3">
    <div className="flex items-center gap-2">
      <Checkbox id="agent-forward" defaultChecked disabled />
      <Label htmlFor="agent-forward">Forward SSH agent (locked by policy)</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="compression" disabled />
      <Label htmlFor="compression">Enable compression</Label>
    </div>
  </Frame>
);
