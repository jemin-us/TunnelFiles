import { Textarea, Label } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const PublicKey = () => (
  <Frame className="grid max-w-md gap-2">
    <Label htmlFor="authorized-key">Authorized public key</Label>
    <Textarea
      id="authorized-key"
      className="font-mono"
      rows={4}
      defaultValue="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK9j2pQnT4mX0vR8sLwd3eFh1bYc7uZ2qK5nP6wA0xVt deploy@prod-web-01"
    />
  </Frame>
);

export const Note = () => (
  <Frame className="grid max-w-md gap-2">
    <Label htmlFor="conn-note">Connection note</Label>
    <Textarea
      id="conn-note"
      rows={4}
      placeholder="Add notes about this host (jump box, owner, maintenance window)…"
    />
  </Frame>
);
