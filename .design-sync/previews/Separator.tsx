import { Separator } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Horizontal = () => (
  <Frame className="max-w-sm">
    <div className="bg-card rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Connection</p>
        <p className="text-muted-foreground text-sm">root@prod-web-01.internal · port 22</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Host key</p>
        <p className="text-muted-foreground font-mono text-sm">SHA256:Hk2pQ9rT…verified</p>
      </div>
    </div>
  </Frame>
);

export const InToolbar = () => (
  <Frame>
    <div className="bg-card text-muted-foreground inline-flex items-center gap-3 rounded-md border px-4 py-2 text-sm">
      <span>/var/www/html</span>
      <Separator orientation="vertical" className="h-4" />
      <span>42 items</span>
      <Separator orientation="vertical" className="h-4" />
      <span>read-write</span>
    </div>
  </Frame>
);
