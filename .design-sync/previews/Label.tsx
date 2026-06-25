import { Label, Input, Checkbox } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Fields = () => (
  <Frame className="grid max-w-sm gap-4">
    <div className="grid gap-2">
      <Label htmlFor="profile-name">Connection name</Label>
      <Input id="profile-name" defaultValue="Production DB" />
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="save-profile" defaultChecked />
      <Label htmlFor="save-profile">Save this connection profile</Label>
    </div>
  </Frame>
);
