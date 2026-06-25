import { Progress } from "tunnelfiles";

// The DS-pane card has a white body; the app's signature theme is dark
// (Midnight Teal). Paint a `bg-background` surface (with the `dark` class so
// `dark:` variants resolve) so cards show the real theme, not white.
function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Transferring = () => (
  <Frame className="space-y-6">
    <div className="w-64 space-y-2">
      <div className="text-muted-foreground flex justify-between text-sm">
        <span className="truncate" title="ubuntu-22.04.iso">
          ubuntu-22.04.iso
        </span>
        <span className="tabular-nums">30%</span>
      </div>
      <Progress value={30} />
    </div>
    <div className="w-64 space-y-2">
      <div className="text-muted-foreground flex justify-between text-sm">
        <span className="truncate" title="backup.tar.gz">
          backup.tar.gz
        </span>
        <span className="tabular-nums">66%</span>
      </div>
      <Progress value={66} />
    </div>
  </Frame>
);

export const Complete = () => (
  <Frame>
    <div className="w-64 space-y-2">
      <div className="text-muted-foreground flex justify-between text-sm">
        <span className="truncate" title="nginx.conf">
          nginx.conf
        </span>
        <span className="text-primary tabular-nums">100%</span>
      </div>
      <Progress value={100} />
    </div>
  </Frame>
);

export const Queue = () => (
  <Frame className="w-72 space-y-4">
    {[
      { name: "dump.sql", pct: 12 },
      { name: "logs-2026-06.zip", pct: 48 },
      { name: "app-release.apk", pct: 87 },
    ].map((t) => (
      <div key={t.name} className="space-y-1.5">
        <div className="text-muted-foreground flex justify-between text-xs">
          <span className="truncate" title={t.name}>
            {t.name}
          </span>
          <span className="tabular-nums">{t.pct}%</span>
        </div>
        <Progress value={t.pct} />
      </div>
    ))}
  </Frame>
);
