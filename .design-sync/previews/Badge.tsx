import { Badge } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Statuses = () => (
  <Frame className="flex flex-wrap items-center gap-2">
    <Badge>Connected</Badge>
    <Badge variant="secondary">SFTP</Badge>
    <Badge variant="destructive">Offline</Badge>
    <Badge variant="outline">Read-only</Badge>
  </Frame>
);

export const TransferTags = () => (
  <Frame className="flex flex-wrap items-center gap-2">
    <Badge>Uploading</Badge>
    <Badge variant="secondary">Queued</Badge>
    <Badge variant="outline">12.4 MB/s</Badge>
    <Badge variant="destructive">Failed</Badge>
  </Frame>
);
