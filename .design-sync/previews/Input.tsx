import { Input, Label } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Fields = () => (
  <Frame className="grid max-w-sm gap-4">
    <div className="grid gap-2">
      <Label htmlFor="host">Host</Label>
      <Input id="host" defaultValue="prod-web-01.internal" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="username">Username</Label>
      <Input id="username" placeholder="root" />
    </div>
  </Frame>
);

export const Credentials = () => (
  <Frame className="grid max-w-sm gap-4">
    <div className="grid gap-2">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" defaultValue="hunter2hunter2" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="port-locked">Port</Label>
      <Input id="port-locked" type="number" defaultValue={22} disabled />
    </div>
  </Frame>
);
