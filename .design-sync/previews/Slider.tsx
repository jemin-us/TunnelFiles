import { Slider } from "tunnelfiles";

function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`dark bg-background text-foreground p-6 ${className}`}>{children}</div>;
}

export const Setting = () => (
  <Frame>
    <div className="w-64 space-y-3">
      <div className="text-foreground flex justify-between text-sm">
        <span>Max concurrent transfers</span>
        <span className="text-muted-foreground tabular-nums">4</span>
      </div>
      <Slider defaultValue={[4]} min={1} max={8} step={1} />
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>1</span>
        <span>8</span>
      </div>
    </div>
  </Frame>
);

export const Range = () => (
  <Frame>
    <div className="w-64 space-y-3">
      <div className="text-foreground flex justify-between text-sm">
        <span>File size filter (MB)</span>
        <span className="text-muted-foreground tabular-nums">20 – 80</span>
      </div>
      <Slider defaultValue={[20, 80]} min={0} max={100} step={5} />
    </div>
  </Frame>
);

export const Disabled = () => (
  <Frame>
    <div className="w-64 space-y-3">
      <div className="text-muted-foreground flex justify-between text-sm">
        <span>Bandwidth limit (offline)</span>
        <span className="tabular-nums">—</span>
      </div>
      <Slider defaultValue={[50]} min={0} max={100} step={10} disabled />
    </div>
  </Frame>
);
