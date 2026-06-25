import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

const ROWS = [
  { name: "config.yaml", size: "1.2 KB", modified: "2 hours ago", perms: "rw-r--r--" },
  { name: "id_ed25519", size: "411 B", modified: "3 days ago", perms: "rw-------" },
  { name: "logs/", size: "—", modified: "12 min ago", perms: "rwxr-xr-x" },
  { name: "backup.tar.gz", size: "248 MB", modified: "yesterday", perms: "rw-r--r--" },
  { name: "docker-compose.yml", size: "3.4 KB", modified: "5 days ago", perms: "rw-r--r--" },
];

export const Files = () => (
  <Frame>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead>Permissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((r) => (
          <TableRow key={r.name}>
            <TableCell className="font-mono">{r.name}</TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">
              {r.size}
            </TableCell>
            <TableCell className="text-muted-foreground">{r.modified}</TableCell>
            <TableCell className="text-muted-foreground font-mono text-xs">{r.perms}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Frame>
);
