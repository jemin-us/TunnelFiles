import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

const FILES = ["config.yaml", "id_ed25519", "logs/", "backup.tar.gz", "docker-compose.yml"];

export const Split = () => (
  <Frame>
    <ResizablePanelGroup
      direction="horizontal"
      className="border-border h-[220px] max-w-xl rounded-lg border"
    >
      <ResizablePanel defaultSize={35}>
        <div className="flex h-full flex-col gap-1 p-3 text-sm">
          <div className="text-muted-foreground px-1 pb-1 text-xs font-medium">/home/deploy</div>
          {FILES.map((f) => (
            <div key={f} className="hover:bg-accent truncate rounded px-2 py-1 font-mono" title={f}>
              {f}
            </div>
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65}>
        <div className="flex h-full flex-col gap-2 p-4">
          <div className="text-foreground font-mono text-sm">config.yaml</div>
          <div className="text-muted-foreground font-mono text-xs leading-relaxed">
            host: db-prod-01.internal
            <br />
            port: 22
            <br />
            user: deploy
            <br />
            timeout: 30
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </Frame>
);
