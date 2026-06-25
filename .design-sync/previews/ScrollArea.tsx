import { ScrollArea } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

const FILES = [
  ".bashrc",
  ".ssh/",
  "Dockerfile",
  "README.md",
  "app-release.apk",
  "backup.tar.gz",
  "docker-compose.yml",
  "dump.sql",
  "logs-2026-06.zip",
  "nginx.conf",
  "node_modules/",
  "package.json",
  "pnpm-lock.yaml",
  "src/",
  "tsconfig.json",
  "ubuntu-22.04.iso",
];

export const FileList = () => (
  <Frame>
    <ScrollArea className="border-border h-48 w-64 rounded-md border">
      <div className="space-y-1 p-3 text-sm">
        <div className="text-muted-foreground px-1 pb-1 text-xs font-medium">/home/deploy</div>
        {FILES.map((f) => (
          <div key={f} className="hover:bg-accent truncate rounded px-2 py-1 font-mono" title={f}>
            {f}
          </div>
        ))}
      </div>
    </ScrollArea>
  </Frame>
);

export const KnownHosts = () => (
  <Frame>
    <ScrollArea className="border-border h-48 w-72 rounded-md border">
      <div className="space-y-2 p-3 text-sm">
        {[
          "10.0.1.42:22",
          "prod-db.internal:2222",
          "staging.example.com:22",
          "192.168.1.10:22",
          "bastion.corp.net:22",
          "ci-runner-01:22",
          "ci-runner-02:22",
          "backup.example.com:22",
          "edge-eu-1.example.com:22",
          "edge-us-1.example.com:22",
        ].map((h) => (
          <div key={h} className="space-y-0.5">
            <div className="text-foreground truncate font-mono" title={h}>
              {h}
            </div>
            <div className="text-muted-foreground truncate font-mono text-xs">
              SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  </Frame>
);
